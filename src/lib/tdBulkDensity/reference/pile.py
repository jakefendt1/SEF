"""Appendix A reference prototype from TD Bulk Density/Calculator Plan.txt.

Ground truth for the 3D heap model (90-degree, zero-thickness flights only).
Kept verbatim so the TypeScript port in ../heap3d.ts can be re-checked against
it. Run: python pile.py
"""
import numpy as np

def seg_min(P, E, q0, q1, k, al):
    """Min over a spill segment of E_q + k*|p - q|_horizontal (closed form)."""
    def w(q):
        x, y, z = q
        return np.array([x*np.cos(al) - y*np.sin(al), z]), x*np.sin(al) + y*np.cos(al)
    h0, E0 = w(q0); h1, E1 = w(q1)
    dh = h1 - h0; L = np.linalg.norm(dh); dE = E1 - E0
    rel = P - h0
    if L < 1e-12:
        return E0 + k*np.linalg.norm(rel, axis=-1)
    u = dh / L
    along = rel @ u
    d = np.abs(rel[..., 0]*u[1] - rel[..., 1]*u[0])
    b = dE / L
    f = lambda s: E0 + b*s + k*np.sqrt((s - along)**2 + d**2)
    cands = [f(np.zeros_like(along)), f(np.full_like(along, L))]
    if k > abs(b):
        cands.append(f(np.clip(along - b*d/np.sqrt(k*k - b*b), 0, L)))
    return np.minimum.reduce(cands)

def volume(H, s, W, a_deg, g_deg, ends="wall", hsw=None, nx=160, nz=120, ny=400):
    al = np.radians(a_deg); k = np.tan(np.radians(g_deg))
    segs = [((0, H, 0), (0, H, W)), ((s, H, 0), (s, H, W))]      # flight tip lines
    for zz in (0, W):
        if ends == "open":
            segs.append(((0, 0, zz), (s, 0, zz)))                 # open end at belt level
        elif ends == "sidewall":
            segs.append(((0, hsw, zz), (s, hsw, zz)))             # sidewall top line
    xs = (np.arange(nx) + .5)/nx*s
    zs = (np.arange(nz) + .5)/nz*W
    ys = (np.arange(ny) + .5)/ny*H
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing="ij")
    Xw = X*np.cos(al) - Y*np.sin(al)
    E = X*np.sin(al) + Y*np.cos(al)
    P = np.stack([Xw, Z], -1)
    S = np.min([seg_min(P, E, np.array(a, float), np.array(b, float), k, al) for a, b in segs], axis=0)
    return (E <= S + 1e-9).sum() * (s/nx)*(W/nz)*(H/ny)

if __name__ == "__main__":
    cases = [
        ("T5 walls", (5, 8, 9.5, 52, 35)),
        ("T6 open", (5, 8, 9.5, 52, 35, "open")),
        ("T7 sw2", (5, 8, 9.5, 52, 35, "sidewall", 2)),
        ("T7 sw4", (5, 8, 9.5, 52, 35, "sidewall", 4)),
        ("T7 sw5", (5, 8, 9.5, 52, 35, "sidewall", 5)),
        ("T7 sw6", (5, 8, 9.5, 52, 35, "sidewall", 6)),
        ("T8 open W30", (5, 8, 30, 52, 35, "open")),
        ("T8 walls W30", (5, 8, 30, 52, 35)),
        ("T9 open g0", (5, 8, 9.5, 52, 0, "open")),
    ]
    for name, args in cases:
        print(f"{name:14s} {volume(*args):8.1f}")
