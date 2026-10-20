using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.Runtime.InteropServices;
using System.Text;

// Utilidades de píxel para estandarizar los sacos a partir de la imagen de la Sal Sabanera.
public class Lienzo
{
    public int W, H;
    public float[] R, G, B, A;   // 0..1

    public Lienzo(int w, int h) { W = w; H = h; R = new float[w * h]; G = new float[w * h]; B = new float[w * h]; A = new float[w * h]; }

    public static Lienzo Cargar(string path)
    {
        using (var src = new Bitmap(path))
        using (var bmp = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb))
        {
            using (var g = Graphics.FromImage(bmp)) g.DrawImage(src, 0, 0, src.Width, src.Height);
            var c = new Lienzo(bmp.Width, bmp.Height);
            var d = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            var buf = new byte[d.Stride * d.Height];
            Marshal.Copy(d.Scan0, buf, 0, buf.Length);
            bmp.UnlockBits(d);
            for (int y = 0; y < c.H; y++) for (int x = 0; x < c.W; x++)
            {
                int o = y * d.Stride + x * 4, i = y * c.W + x;
                c.B[i] = buf[o] / 255f; c.G[i] = buf[o + 1] / 255f; c.R[i] = buf[o + 2] / 255f; c.A[i] = buf[o + 3] / 255f;
            }
            return c;
        }
    }

    public void Guardar(string path)
    {
        using (var bmp = new Bitmap(W, H, PixelFormat.Format32bppArgb))
        {
            var d = bmp.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
            var buf = new byte[d.Stride * H];
            for (int y = 0; y < H; y++) for (int x = 0; x < W; x++)
            {
                int o = y * d.Stride + x * 4, i = y * W + x;
                buf[o] = B8(B[i]); buf[o + 1] = B8(G[i]); buf[o + 2] = B8(R[i]); buf[o + 3] = B8(A[i]);
            }
            Marshal.Copy(buf, 0, d.Scan0, buf.Length);
            bmp.UnlockBits(d);
            bmp.Save(path, ImageFormat.Png);
        }
    }

    static byte B8(float v) { return (byte)Math.Max(0, Math.Min(255, Math.Round(v * 255))); }

    public Lienzo Copia()
    {
        var c = new Lienzo(W, H);
        Array.Copy(R, c.R, R.Length); Array.Copy(G, c.G, G.Length); Array.Copy(B, c.B, B.Length); Array.Copy(A, c.A, A.Length);
        return c;
    }

    public float L(int i) { return 0.2126f * R[i] + 0.7152f * G[i] + 0.0722f * B[i]; }

    // Tono (0..360), saturación y luminosidad HSL
    public static void HSL(float r, float g, float b, out float h, out float s, out float l)
    {
        float max = Math.Max(r, Math.Max(g, b)), min = Math.Min(r, Math.Min(g, b));
        l = (max + min) / 2f;
        if (max - min < 1e-5f) { h = 0; s = 0; return; }
        float d = max - min;
        s = l > 0.5f ? d / (2f - max - min) : d / (max + min);
        if (max == r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max == g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60f;
    }

    public static void RGB(float h, float s, float l, out float r, out float g, out float b)
    {
        if (s <= 0) { r = g = b = l; return; }
        float q = l < 0.5f ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
        r = Hue(p, q, h / 360f + 1f / 3); g = Hue(p, q, h / 360f); b = Hue(p, q, h / 360f - 1f / 3);
    }

    static float Hue(float p, float q, float t)
    {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1f / 6) return p + (q - p) * 6 * t;
        if (t < 0.5f) return q;
        if (t < 2f / 3) return p + (q - p) * (2f / 3 - t) * 6;
        return p;
    }

    // Píxeles cuyo tono está en [h0,h1] con saturación >= s0 y luminosidad en [l0,l1] dentro de un rectángulo
    public bool[] Mascara(Rectangle zona, float h0, float h1, float s0, float l0, float l1)
    {
        var m = new bool[W * H];
        for (int y = Math.Max(0, zona.Top); y < Math.Min(H, zona.Bottom); y++)
            for (int x = Math.Max(0, zona.Left); x < Math.Min(W, zona.Right); x++)
            {
                int i = y * W + x; if (A[i] < 0.5f) continue;
                float h, s, l; HSL(R[i], G[i], B[i], out h, out s, out l);
                bool enTono = h0 <= h1 ? (h >= h0 && h <= h1) : (h >= h0 || h <= h1);
                if (enTono && s >= s0 && l >= l0 && l <= l1) m[i] = true;
            }
        return m;
    }

    public bool[] Dilatar(bool[] m, int r)
    {
        var o = new bool[m.Length];
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++)
        {
            if (!m[y * W + x]) continue;
            for (int dy = -r; dy <= r; dy++) for (int dx = -r; dx <= r; dx++)
            {
                int xx = x + dx, yy = y + dy;
                if (xx >= 0 && yy >= 0 && xx < W && yy < H && dx * dx + dy * dy <= r * r) o[yy * W + xx] = true;
            }
        }
        return o;
    }

    public static string Caja(bool[] m, int W)
    {
        int x0 = int.MaxValue, y0 = int.MaxValue, x1 = -1, y1 = -1, n = 0;
        for (int i = 0; i < m.Length; i++) if (m[i]) { n++; int x = i % W, y = i / W; x0 = Math.Min(x0, x); y0 = Math.Min(y0, y); x1 = Math.Max(x1, x); y1 = Math.Max(y1, y); }
        return n == 0 ? "vacía" : string.Format("x {0}-{1}, y {2}-{3} ({4} px)", x0, x1, y0, y1, n);
    }

    // Perfil: cuántos píxeles de la máscara hay por fila (o columna) dentro de una zona
    public static string Perfil(bool[] m, int W, Rectangle z, bool porFila, int paso)
    {
        var sb = new StringBuilder();
        int a = porFila ? z.Top : z.Left, b = porFila ? z.Bottom : z.Right;
        for (int k = a; k < b; k += paso)
        {
            int n = 0;
            for (int t = k; t < Math.Min(b, k + paso); t++)
                for (int u = porFila ? z.Left : z.Top; u < (porFila ? z.Right : z.Bottom); u++)
                    if (m[porFila ? t * W + u : u * W + t]) n++;
            sb.AppendFormat("{0}:{1} ", k, n);
        }
        return sb.ToString();
    }

    // Visualiza una máscara sobre la imagen (rojo) para revisarla
    public void Marcar(bool[] m, float r, float g, float b)
    {
        for (int i = 0; i < m.Length; i++) if (m[i]) { R[i] = r; G[i] = g; B[i] = b; A[i] = 1; }
    }
}
