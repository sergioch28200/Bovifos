using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.Runtime.InteropServices;

// Operaciones de edición sobre la foto de la Sabanera conservando la trama del saco.
public static class Procesador
{
    // Relación luminosidad / luminosidad media local: es la "trama" del tejido, independiente de la luz.
    public static float[] Trama(Lienzo c, int radio)
    {
        int W = c.W, H = c.H;
        var L = new float[W * H];
        for (int i = 0; i < L.Length; i++) L[i] = c.L(i);
        var integ = new double[(W + 1) * (H + 1)];
        for (int y = 0; y < H; y++)
        {
            double fila = 0;
            for (int x = 0; x < W; x++) { fila += L[y * W + x]; integ[(y + 1) * (W + 1) + x + 1] = integ[y * (W + 1) + x + 1] + fila; }
        }
        var t = new float[W * H];
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++)
        {
            int x0 = Math.Max(0, x - radio), x1 = Math.Min(W, x + radio + 1), y0 = Math.Max(0, y - radio), y1 = Math.Min(H, y + radio + 1);
            double s = integ[y1 * (W + 1) + x1] - integ[y0 * (W + 1) + x1] - integ[y1 * (W + 1) + x0] + integ[y0 * (W + 1) + x0];
            double m = s / ((x1 - x0) * (y1 - y0));
            t[y * W + x] = m > 0.02 ? (float)(L[y * W + x] / m) : 1f;
        }
        return t;
    }

    // Cambia el tono de los píxeles naranjas (bandas laterales) al color de la referencia.
    public static int Recolorear(Lienzo c, Rectangle[] zonas, float h0, float h1, float sMin,
                                 float hRef, float sRef, float lRef, float hNuevo, float sNuevo, float lNuevo)
    {
        int n = 0;
        foreach (var z in zonas)
            for (int y = Math.Max(0, z.Top); y < Math.Min(c.H, z.Bottom); y++)
                for (int x = Math.Max(0, z.Left); x < Math.Min(c.W, z.Right); x++)
                {
                    int i = y * c.W + x; if (c.A[i] < 0.05f) continue;
                    float h, s, l; Lienzo.HSL(c.R[i], c.G[i], c.B[i], out h, out s, out l);
                    if (h < h0 || h > h1 || s < sMin || l > 0.97f) continue;
                    float s2 = Math.Min(1f, s * sNuevo / sRef);
                    float l2 = Math.Max(0f, Math.Min(1f, l + (lNuevo - lRef) * Math.Min(1f, s / sRef)));
                    float r, g, b; Lienzo.RGB(hNuevo, s2, l2, out r, out g, out b);
                    c.R[i] = r; c.G[i] = g; c.B[i] = b; n++;
                }
        return n;
    }

    // Borra el texto verde de una zona: rellena desde los bordes y le devuelve la trama tomada de otra zona libre.
    // lMax: además del verde, se borra todo píxel más oscuro que lMax (el contorno oscuro de las letras).
    public static int Borrar(Lienzo c, float[] trama, Rectangle zona, int dx, int dy, int dilatar, float lMax)
    {
        var m = c.Mascara(zona, 95, 175, 0.18f, 0.03f, 0.70f);
        for (int y = Math.Max(0, zona.Top); y < Math.Min(c.H, zona.Bottom); y++)
            for (int x = Math.Max(0, zona.Left); x < Math.Min(c.W, zona.Right); x++)
            {
                int i = y * c.W + x;
                if (c.A[i] <= 0.5f) continue;
                float h, s, l; Lienzo.HSL(c.R[i], c.G[i], c.B[i], out h, out s, out l);
                bool banda = h >= 5 && h <= 45 && s > 0.3f;   // el naranja de la banda no es texto
                // lMax >= 1: zona sobre la banda naranja -> se borra todo lo que no sea naranja
                if (!banda && (lMax >= 1f || c.L(i) < lMax)) m[i] = true;
            }
        m = c.Dilatar(m, dilatar);
        for (int i = 0; i < m.Length; i++) { int x = i % c.W, y = i / c.W; if (!zona.Contains(x, y)) m[i] = false; }

        int pendientes = 0; foreach (var v in m) if (v) pendientes++;
        int total = pendientes;
        var lleno = new bool[m.Length]; for (int i = 0; i < m.Length; i++) lleno[i] = !m[i];
        int[] ox = { -1, 1, 0, 0, -1, 1, -1, 1 }, oy = { 0, 0, -1, 1, -1, -1, 1, 1 };
        int guard = 0;
        while (pendientes > 0 && guard++ < 400)
        {
            var nuevos = new List<int>();
            var nr = new List<float>(); var ng = new List<float>(); var nb = new List<float>();
            for (int y = zona.Top; y < zona.Bottom; y++) for (int x = zona.Left; x < zona.Right; x++)
            {
                int i = y * c.W + x; if (lleno[i]) continue;
                float sr = 0, sg = 0, sb = 0; int k = 0;
                for (int d = 0; d < 8; d++)
                {
                    int xx = x + ox[d], yy = y + oy[d];
                    if (xx < 0 || yy < 0 || xx >= c.W || yy >= c.H) continue;
                    int j = yy * c.W + xx; if (!lleno[j]) continue;
                    // color tal cual del vecino: corregirlo por la trama local oscurecía el relleno
                    // con la forma de las letras (la media local incluye el texto oscuro)
                    sr += c.R[j]; sg += c.G[j]; sb += c.B[j]; k++;
                }
                if (k >= 2) { nuevos.Add(i); nr.Add(sr / k); ng.Add(sg / k); nb.Add(sb / k); }
            }
            if (nuevos.Count == 0) break;
            for (int q = 0; q < nuevos.Count; q++)
            {
                int i = nuevos[q];
                c.R[i] = nr[q]; c.G[i] = ng[q]; c.B[i] = nb[q];
                trama[i] = 1f; lleno[i] = true; pendientes--;
            }
        }
        // devolver la trama del tejido, copiada de una zona sin texto
        for (int i = 0; i < m.Length; i++)
        {
            if (!m[i]) continue;
            int x = i % c.W + dx, y = i / c.W + dy;
            if (x < 0 || y < 0 || x >= c.W || y >= c.H) continue;
            float t = trama[y * c.W + x];
            // el relleno ya es casi liso: se le aplica la trama de la zona limpia (suavizada para no exagerarla)
            float tt = 1f + (t - 1f) * 0.9f;
            c.R[i] = Clamp(c.R[i] * tt); c.G[i] = Clamp(c.G[i] * tt); c.B[i] = Clamp(c.B[i] * tt);
            trama[i] = t;
        }
        return total;
    }

    // Escribe texto con la trama del saco. ancla = punto de inicio de la línea base; angulo en grados (90 = hacia abajo).
    // altoMayus = altura de mayúscula en px; escalaLargo permite comprimir/estirar a lo largo (perspectiva lateral);
    // largoMax limita el largo total (si no cabe, se reduce todo de forma proporcional).
    public static float Escribir(Lienzo c, float[] trama, string texto, string fuente, FontStyle estilo,
                                 float anclaX, float anclaY, float angulo, float altoMayus, float escalaLargo,
                                 float largoMax, float colR, float colG, float colB, int dx, int dy)
    {
        var fam = new FontFamily(fuente);
        float em = 100f;
        float cap, largo;
        using (var pH = new GraphicsPath())
        {
            pH.AddString("H", fam, (int)estilo, em, new PointF(0, 0), StringFormat.GenericTypographic);
            var bH = pH.GetBounds(); cap = bH.Height;
            float baseH = bH.Bottom;
            using (var p = new GraphicsPath())
            {
                p.AddString(texto, fam, (int)estilo, em, new PointF(0, 0), StringFormat.GenericTypographic);
                var b = p.GetBounds();
                float esc = altoMayus / cap;
                largo = b.Width * esc * escalaLargo;
                if (largoMax > 0 && largo > largoMax) { float f = largoMax / largo; esc *= f; largo = largoMax; }
                var mtx = new Matrix();
                mtx.Translate(anclaX, anclaY, MatrixOrder.Append);
                mtx.Rotate(angulo, MatrixOrder.Prepend);
                mtx.Scale(esc * escalaLargo, esc, MatrixOrder.Prepend);
                mtx.Translate(-b.Left, -baseH, MatrixOrder.Prepend);
                p.Transform(mtx);

                using (var bmp = new Bitmap(c.W, c.H, PixelFormat.Format32bppArgb))
                {
                    using (var g = Graphics.FromImage(bmp))
                    {
                        g.SmoothingMode = SmoothingMode.AntiAlias;
                        g.Clear(Color.Transparent);
                        g.FillPath(Brushes.White, p);
                    }
                    var d = bmp.LockBits(new Rectangle(0, 0, c.W, c.H), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                    var buf = new byte[d.Stride * c.H];
                    Marshal.Copy(d.Scan0, buf, 0, buf.Length);
                    bmp.UnlockBits(d);
                    for (int y = 0; y < c.H; y++) for (int x = 0; x < c.W; x++)
                    {
                        float a = buf[y * d.Stride + x * 4 + 3] / 255f; if (a <= 0) continue;
                        int i = y * c.W + x;
                        int sx = Math.Max(0, Math.Min(c.W - 1, x + dx)), sy = Math.Max(0, Math.Min(c.H - 1, y + dy));
                        float t = trama[sy * c.W + sx];
                        float tr = Clamp(colR * t), tg = Clamp(colG * t), tb = Clamp(colB * t);
                        c.R[i] = c.R[i] * (1 - a) + tr * a; c.G[i] = c.G[i] * (1 - a) + tg * a; c.B[i] = c.B[i] * (1 - a) + tb * a;
                    }
                }
            }
        }
        return largo;
    }

    // Color medio del texto verde en una zona (para reutilizar exactamente el verde de impresión)
    public static float[] ColorTexto(Lienzo c, Rectangle zona)
    {
        var m = c.Mascara(zona, 95, 175, 0.35f, 0.08f, 0.45f);
        double r = 0, g = 0, b = 0; int n = 0;
        for (int i = 0; i < m.Length; i++) if (m[i]) { r += c.R[i]; g += c.G[i]; b += c.B[i]; n++; }
        return n == 0 ? new float[] { 0.12f, 0.45f, 0.22f } : new float[] { (float)(r / n), (float)(g / n), (float)(b / n) };
    }

    static float Clamp(float v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
}
