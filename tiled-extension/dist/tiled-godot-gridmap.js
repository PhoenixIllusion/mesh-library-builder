"use strict";
(() => {
  var Wt = Object.defineProperty;
  var Xt = (i, f) => {
    for (var r in f)
      Wt(i, r, { get: f[r], enumerable: !0 });
  };

  // src/godot-gridmap/convert/rot_tilemap_flag_convert.mts
  var qt = Tile.FlippedHorizontally | Tile.FlippedAntiDiagonally, Jt = Tile.FlippedVertically | Tile.FlippedAntiDiagonally, Qt = Tile.FlippedVertically | Tile.FlippedHorizontally, Ae = 0, Fe = 22, Ce = 16, Te = 10;
  function we(i) {
    switch (i) {
      case Fe:
        return qt;
      case Ce:
        return Jt;
      case Te:
        return Qt;
    }
    return Ae;
  }
  function Me(i, f, r) {
    return i && r ? Fe : f && r ? Ce : i && f ? Te : Ae;
  }

  // src/godot-gridmap/convert/gridmap_to_tmx.mts
  var K = class {
    constructor() {
      this.min = 1e30;
      this.max = -1e30;
    }
    update(f) {
      this.min = Math.min(this.min, f), this.max = Math.max(this.max, f);
    }
    range() {
      return [this.min, this.max];
    }
    length() {
      return this.max - this.min;
    }
  };
  function Yt(i, f, r) {
    let c = i.mesh_library;
    if (r[c])
      return r[c];
    let g = c.replace(/^.+\//, "").replace(/\.tres/, ""), $ = `${f.replace(/\/[^\/]+$/, "")}/${g}.tsx`, p = tiled.tilesetFormat("tsx").read($);
    return r[c] = p, p;
  }
  function Ee(i, f) {
    let r = new TileMap();
    r.tileHeight = 48, r.tileWidth = 48, r.infinite = !0;
    let c = {}, g = { x: new K(), y: new K(), z: new K() }, $ = {};
    f.forEach((p) => {
      r.setProperty(`cell_size:${p.name}`, `Vector3(${p.cell_size.join(",")})`), r.setProperty(`cell_scale:${p.name}`, p.cell_scale), r.setProperty(`transform:${p.name}`, `Transform3D(${p.transform.join(",")})`), r.setProperty(`mesh_library:${p.name}`, p.mesh_library);
      let A = Yt(p, i, c);
      A && p.data.forEach(({ x: F, y: v, z: h, item: x, rot: w }) => {
        let M = `${p.name}: ${v}`;
        if (!$[M]) {
          let T = new TileLayer(M);
          T.setProperty("y", v), T.setProperty("gridmap", p.name), $[M] = { y: v, name: p.name, layer: T, edit: T.edit() };
        }
        $[M].edit.setTile(F, h, A.tile(x), we(w)), g.x.update(F), g.y.update(v), g.z.update(h);
      });
    });
    for (let p of Object.values($).sort((A, F) => F.y == A.y ? F.name.localeCompare(A.name) : F.y - A.y)) {
      let { layer: A, edit: F } = p;
      F.apply(), r.addLayer(A);
    }
    return r.width = g.x.length(), r.height = g.z.length(), r;
  }

  // src/godot-gridmap/tscn-reader/parser.mjs
  var H = {};
  Xt(H, {
    StartRules: () => tn,
    SyntaxError: () => j,
    parse: () => rn
  });
  function en(i, f) {
    function r() {
      this.constructor = i;
    }
    r.prototype = f.prototype, i.prototype = new r();
  }
  function j(i, f, r, c) {
    var g = Error.call(this, i);
    return Object.setPrototypeOf && Object.setPrototypeOf(g, j.prototype), g.expected = f, g.found = r, g.location = c, g.name = "SyntaxError", g;
  }
  en(j, Error);
  function J(i, f, r) {
    return r = r || " ", i.length > f ? i : (f -= i.length, r += r.repeat(f), i + r.slice(0, f));
  }
  j.prototype.format = function(i) {
    var f = "Error: " + this.message;
    if (this.location) {
      var r = null, c;
      for (c = 0; c < i.length; c++)
        if (i[c].source === this.location.source) {
          r = i[c].text.split(/\r\n|\n|\r/g);
          break;
        }
      var g = this.location.start, $ = this.location.source && typeof this.location.source.offset == "function" ? this.location.source.offset(g) : g, p = this.location.source + ":" + $.line + ":" + $.column;
      if (r) {
        var A = this.location.end, F = J("", $.line.toString().length, " "), v = r[g.line - 1], h = g.line === A.line ? A.column : v.length + 1, x = h - g.column || 1;
        f += `
 --> ` + p + `
` + F + ` |
` + $.line + " | " + v + `
` + F + " | " + J("", g.column - 1, " ") + J("", x, "^");
      } else
        f += `
 at ` + p;
    }
    return f;
  };
  j.buildMessage = function(i, f) {
    var r = {
      literal: function(v) {
        return '"' + g(v.text) + '"';
      },
      class: function(v) {
        var h = v.parts.map(function(x) {
          return Array.isArray(x) ? $(x[0]) + "-" + $(x[1]) : $(x);
        });
        return "[" + (v.inverted ? "^" : "") + h.join("") + "]";
      },
      any: function() {
        return "any character";
      },
      end: function() {
        return "end of input";
      },
      other: function(v) {
        return v.description;
      }
    };
    function c(v) {
      return v.charCodeAt(0).toString(16).toUpperCase();
    }
    function g(v) {
      return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(h) {
        return "\\x0" + c(h);
      }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(h) {
        return "\\x" + c(h);
      });
    }
    function $(v) {
      return v.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(h) {
        return "\\x0" + c(h);
      }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(h) {
        return "\\x" + c(h);
      });
    }
    function p(v) {
      return r[v.type](v);
    }
    function A(v) {
      var h = v.map(p), x, w;
      if (h.sort(), h.length > 0) {
        for (x = 1, w = 1; x < h.length; x++)
          h[x - 1] !== h[x] && (h[w] = h[x], w++);
        h.length = w;
      }
      switch (h.length) {
        case 1:
          return h[0];
        case 2:
          return h[0] + " or " + h[1];
        default:
          return h.slice(0, -1).join(", ") + ", or " + h[h.length - 1];
      }
    }
    function F(v) {
      return v ? '"' + g(v) + '"' : "end of input";
    }
    return "Expected " + A(i) + " but " + F(f) + " found.";
  };
  function rn(i, f) {
    f = f !== void 0 ? f : {};
    var r = {}, c = f.grammarSource, g = { start: de }, $ = de, p = "[", A = `]
`, F = "gd_scene", v = "gd_resource", h = "ext_resource", x = "sub_resource", w = "node", M = "connection", E = "resource", T = "remap", D = "=", z = `
`, De = "{", ze = "]", Ve = "}", ke = ":", Oe = ",", Se = "(", Ue = ")", Q = "false", Y = "null", ee = "true", Ke = ".", Ne = "-", Be = "+", Le = "0", He = "b", Ze = "f", We = "n", Xe = "r", qe = "t", Je = "u", Qe = "\\", Ye = '"', re = /^[a-zA-Z0-9.\/_]/, te = /^[ \t\n\r]/, ne = /^[A-Za-z0-9]/, er = /^[1-9]/, rr = /^[eE]/, tr = /^[+\-]/, nr = /^["\/\\]/, sr = /^[^\0-\x1F"\\]/, ar = /^[0-9]/, ir = /^[0-9a-f]/i, lr = _t(), se = b("[", !1), fr = b(`]
`, !1), or = b("gd_scene", !1), cr = b("gd_resource", !1), ur = b("ext_resource", !1), pr = b("sub_resource", !1), gr = b("node", !1), dr = b("connection", !1), $r = b("resource", !1), vr = b("remap", !1), ae = b("=", !1), hr = b(`
`, !1), ie = R([["a", "z"], ["A", "Z"], ["0", "9"], ".", "/", "_"], !1, !1), mr = b("{", !1), yr = b("]", !1), br = b("}", !1), xr = b(":", !1), _r = b(",", !1), Ar = B("whitespace"), le = R([" ", "	", `
`, "\r"], !1, !1), fe = R([["A", "Z"], ["a", "z"], ["0", "9"]], !1, !1), Fr = b("(", !1), Cr = b(")", !1), Tr = b("false", !1), wr = b("null", !1), Mr = b("true", !1), Er = B("number"), Pr = b(".", !1), Rr = R([["1", "9"]], !1, !1), Ir = R(["e", "E"], !1, !1), Gr = R(["+", "-"], !1, !1), jr = b("-", !1), Dr = b("+", !1), zr = b("0", !1), Vr = B("string"), kr = R(['"', "/", "\\"], !1, !1), Or = b("b", !1), Sr = b("f", !1), Ur = b("n", !1), Kr = b("r", !1), Nr = b("t", !1), Br = b("u", !1), Lr = b("\\", !1), Hr = b('"', !1), Zr = R([["\0", ""], '"', "\\"], !0, !1), Wr = R([["0", "9"]], !1, !1), Xr = R([["0", "9"], ["a", "f"]], !1, !0), qr = function(e) {
      return e;
    }, Jr = function(e, n) {
      return { block: e, props: n.filter((s) => s != `
`) };
    }, Qr = function(e, n) {
      return { type: e, attr: n };
    }, Yr = function(e, n) {
      return [e, n];
    }, et = function(e, n) {
      return [e, n];
    }, rt = function(e) {
      return e;
    }, oe = function(e, n, s) {
      return s;
    }, tt = function(e, n, s) {
      return [n].concat(s);
    }, nt = function(e, n) {
      return { method: e, args: n };
    }, st = function() {
      return !1;
    }, at = function() {
      return null;
    }, it = function() {
      return !0;
    }, ce = function(e, n) {
      return n;
    }, lt = function(e, n) {
      var s = {};
      return [e].concat(n).forEach(function(a) {
        s[a.name] = a.value;
      }), s;
    }, ft = function(e) {
      return e !== null ? e : {};
    }, ot = function(e, n) {
      return { name: e, value: n };
    }, ue = function(e, n) {
      return n;
    }, ct = function(e, n) {
      return [e].concat(n);
    }, ut = function(e) {
      return e !== null ? e : [];
    }, pt = function() {
      return parseFloat(xt());
    }, gt = function(e) {
      return e.join("");
    }, dt = function() {
      return "\b";
    }, $t = function() {
      return "\f";
    }, vt = function() {
      return `
`;
    }, ht = function() {
      return "\r";
    }, mt = function() {
      return "	";
    }, yt = function(e) {
      return String.fromCharCode(parseInt(e, 16));
    }, bt = function(e) {
      return e;
    }, t = f.peg$currPos | 0, m = t, V = [{ line: 1, column: 1 }], P = t, N = f.peg$maxFailExpected || [], o = f.peg$silentFails | 0, S;
    if (f.startRule) {
      if (!(f.startRule in g))
        throw new Error(`Can't start parsing from rule "` + f.startRule + '".');
      $ = g[f.startRule];
    }
    function xt() {
      return i.substring(m, t);
    }
    function pn() {
      return m;
    }
    function gn() {
      return {
        source: c,
        start: m,
        end: t
      };
    }
    function dn() {
      return U(m, t);
    }
    function $n(e, n) {
      throw n = n !== void 0 ? n : U(m, t), ge(
        [B(e)],
        i.substring(m, t),
        n
      );
    }
    function vn(e, n) {
      throw n = n !== void 0 ? n : U(m, t), Ft(e, n);
    }
    function b(e, n) {
      return { type: "literal", text: e, ignoreCase: n };
    }
    function R(e, n, s) {
      return { type: "class", parts: e, inverted: n, ignoreCase: s };
    }
    function _t() {
      return { type: "any" };
    }
    function At() {
      return { type: "end" };
    }
    function B(e) {
      return { type: "other", description: e };
    }
    function pe(e) {
      var n = V[e], s;
      if (n)
        return n;
      if (e >= V.length)
        s = V.length - 1;
      else
        for (s = e; !V[--s]; )
          ;
      for (n = V[s], n = {
        line: n.line,
        column: n.column
      }; s < e; )
        i.charCodeAt(s) === 10 ? (n.line++, n.column = 1) : n.column++, s++;
      return V[e] = n, n;
    }
    function U(e, n, s) {
      var a = pe(e), d = pe(n), l = {
        source: c,
        start: {
          offset: e,
          line: a.line,
          column: a.column
        },
        end: {
          offset: n,
          line: d.line,
          column: d.column
        }
      };
      return s && c && typeof c.offset == "function" && (l.start = c.offset(l.start), l.end = c.offset(l.end)), l;
    }
    function u(e) {
      t < P || (t > P && (P = t, N = []), N.push(e));
    }
    function Ft(e, n) {
      return new j(e, null, null, n);
    }
    function ge(e, n, s) {
      return new j(
        j.buildMessage(e, n),
        e,
        n,
        s
      );
    }
    function de() {
      var e, n, s, a;
      if (e = t, n = [], s = $e(), s !== r)
        for (; s !== r; )
          n.push(s), s = $e();
      else
        n = r;
      return n !== r ? (s = t, o++, i.length > t ? (a = i.charAt(t), t++) : (a = r, o === 0 && u(lr)), o--, a === r ? s = void 0 : (t = s, s = r), s !== r ? (m = e, e = qr(n)) : (t = e, e = r)) : (t = e, e = r), e;
    }
    function $e() {
      var e, n, s, a, d, l, y, _;
      if (e = t, i.charCodeAt(t) === 91 ? (n = p, t++) : (n = r, o === 0 && u(se)), n !== r)
        if (s = C(), a = Ct(), a !== r)
          if (d = C(), i.substr(t, 2) === A ? (l = A, t += 2) : (l = r, o === 0 && u(fr)), l !== r) {
            for (y = [], _ = he(); _ !== r; )
              y.push(_), _ = he();
            m = e, e = Jr(a, y);
          } else
            t = e, e = r;
        else
          t = e, e = r;
      else
        t = e, e = r;
      return e;
    }
    function Ct() {
      var e, n, s, a;
      if (e = t, n = Tt(), n !== r) {
        for (s = [], a = ve(); a !== r; )
          s.push(a), a = ve();
        m = e, e = Qr(n, s);
      } else
        t = e, e = r;
      return e;
    }
    function Tt() {
      var e;
      return i.substr(t, 8) === F ? (e = F, t += 8) : (e = r, o === 0 && u(or)), e === r && (i.substr(t, 11) === v ? (e = v, t += 11) : (e = r, o === 0 && u(cr)), e === r && (i.substr(t, 12) === h ? (e = h, t += 12) : (e = r, o === 0 && u(ur)), e === r && (i.substr(t, 12) === x ? (e = x, t += 12) : (e = r, o === 0 && u(pr)), e === r && (i.substr(t, 4) === w ? (e = w, t += 4) : (e = r, o === 0 && u(gr)), e === r && (i.substr(t, 10) === M ? (e = M, t += 10) : (e = r, o === 0 && u(dr)), e === r && (i.substr(t, 8) === E ? (e = E, t += 8) : (e = r, o === 0 && u($r)), e === r && (i.substr(t, 5) === T ? (e = T, t += 5) : (e = r, o === 0 && u(vr))))))))), e;
    }
    function ve() {
      var e, n, s, a, d, l;
      return e = t, n = C(), s = t, a = me(), a !== r ? s = i.substring(s, t) : s = a, s !== r ? (i.charCodeAt(t) === 61 ? (a = D, t++) : (a = r, o === 0 && u(ae)), a !== r ? (d = t, l = X(), l === r && (l = be(), l === r && (l = ye())), l !== r ? d = i.substring(d, t) : d = l, d !== r ? (m = e, e = Yr(s, d)) : (t = e, e = r)) : (t = e, e = r)) : (t = e, e = r), e;
    }
    function he() {
      var e;
      return e = wt(), e === r && (i.charCodeAt(t) === 10 ? (e = z, t++) : (e = r, o === 0 && u(hr))), e;
    }
    function wt() {
      var e, n, s, a, d, l;
      return e = t, n = t, s = me(), s !== r ? n = i.substring(n, t) : n = s, n !== r ? (s = C(), i.charCodeAt(t) === 61 ? (a = D, t++) : (a = r, o === 0 && u(ae)), a !== r ? (d = C(), l = G(), l !== r ? (m = e, e = et(n, l)) : (t = e, e = r)) : (t = e, e = r)) : (t = e, e = r), e;
    }
    function me() {
      var e, n;
      if (e = [], n = i.charAt(t), re.test(n) ? t++ : (n = r, o === 0 && u(ie)), n !== r)
        for (; n !== r; )
          e.push(n), n = i.charAt(t), re.test(n) ? t++ : (n = r, o === 0 && u(ie));
      else
        e = r;
      return e;
    }
    function hn() {
      var e, n, s, a;
      return e = t, n = C(), s = G(), s !== r ? (a = C(), m = e, e = rt(s)) : (t = e, e = r), e;
    }
    function Mt() {
      var e, n, s, a;
      return e = t, n = C(), i.charCodeAt(t) === 91 ? (s = p, t++) : (s = r, o === 0 && u(se)), s !== r ? (a = C(), n = [n, s, a], e = n) : (t = e, e = r), e;
    }
    function Et() {
      var e, n, s, a;
      return e = t, n = C(), i.charCodeAt(t) === 123 ? (s = De, t++) : (s = r, o === 0 && u(mr)), s !== r ? (a = C(), n = [n, s, a], e = n) : (t = e, e = r), e;
    }
    function Pt() {
      var e, n, s, a;
      return e = t, n = C(), i.charCodeAt(t) === 93 ? (s = ze, t++) : (s = r, o === 0 && u(yr)), s !== r ? (a = C(), n = [n, s, a], e = n) : (t = e, e = r), e;
    }
    function Rt() {
      var e, n, s, a;
      return e = t, n = C(), i.charCodeAt(t) === 125 ? (s = Ve, t++) : (s = r, o === 0 && u(br)), s !== r ? (a = C(), n = [n, s, a], e = n) : (t = e, e = r), e;
    }
    function It() {
      var e, n, s, a;
      return e = t, n = C(), i.charCodeAt(t) === 58 ? (s = ke, t++) : (s = r, o === 0 && u(xr)), s !== r ? (a = C(), n = [n, s, a], e = n) : (t = e, e = r), e;
    }
    function k() {
      var e, n, s, a;
      return e = t, n = C(), i.charCodeAt(t) === 44 ? (s = Oe, t++) : (s = r, o === 0 && u(_r)), s !== r ? (a = C(), n = [n, s, a], e = n) : (t = e, e = r), e;
    }
    function C() {
      var e, n;
      for (o++, e = [], n = i.charAt(t), te.test(n) ? t++ : (n = r, o === 0 && u(le)); n !== r; )
        e.push(n), n = i.charAt(t), te.test(n) ? t++ : (n = r, o === 0 && u(le));
      return o--, n = r, o === 0 && u(Ar), e;
    }
    function G() {
      var e;
      return e = Gt(), e === r && (e = jt(), e === r && (e = Dt(), e === r && (e = zt(), e === r && (e = Vt(), e === r && (e = be(), e === r && (e = X(), e === r && (e = ye()))))))), e;
    }
    function ye() {
      var e, n, s, a, d, l, y, _, I;
      if (e = t, n = t, s = [], a = i.charAt(t), ne.test(a) ? t++ : (a = r, o === 0 && u(fe)), a !== r)
        for (; a !== r; )
          s.push(a), a = i.charAt(t), ne.test(a) ? t++ : (a = r, o === 0 && u(fe));
      else
        s = r;
      if (s !== r ? n = i.substring(n, t) : n = s, n !== r)
        if (i.charCodeAt(t) === 40 ? (s = Se, t++) : (s = r, o === 0 && u(Fr)), s !== r) {
          if (a = t, d = G(), d !== r) {
            for (l = [], y = t, _ = k(), _ !== r ? (I = G(), I !== r ? (m = y, y = oe(n, d, I)) : (t = y, y = r)) : (t = y, y = r); y !== r; )
              l.push(y), y = t, _ = k(), _ !== r ? (I = G(), I !== r ? (m = y, y = oe(n, d, I)) : (t = y, y = r)) : (t = y, y = r);
            m = a, a = tt(n, d, l);
          } else
            t = a, a = r;
          a === r && (a = null), i.charCodeAt(t) === 41 ? (d = Ue, t++) : (d = r, o === 0 && u(Cr)), d !== r ? (m = e, e = nt(n, a)) : (t = e, e = r);
        } else
          t = e, e = r;
      else
        t = e, e = r;
      return e;
    }
    function Gt() {
      var e, n;
      return e = t, i.substr(t, 5) === Q ? (n = Q, t += 5) : (n = r, o === 0 && u(Tr)), n !== r && (m = e, n = st()), e = n, e;
    }
    function jt() {
      var e, n;
      return e = t, i.substr(t, 4) === Y ? (n = Y, t += 4) : (n = r, o === 0 && u(wr)), n !== r && (m = e, n = at()), e = n, e;
    }
    function Dt() {
      var e, n;
      return e = t, i.substr(t, 4) === ee ? (n = ee, t += 4) : (n = r, o === 0 && u(Mr)), n !== r && (m = e, n = it()), e = n, e;
    }
    function zt() {
      var e, n, s, a, d, l, y, _;
      if (e = t, n = Et(), n !== r) {
        if (s = t, a = W(), a !== r) {
          for (d = [], l = t, y = k(), y !== r ? (_ = W(), _ !== r ? (m = l, l = ce(a, _)) : (t = l, l = r)) : (t = l, l = r); l !== r; )
            d.push(l), l = t, y = k(), y !== r ? (_ = W(), _ !== r ? (m = l, l = ce(a, _)) : (t = l, l = r)) : (t = l, l = r);
          m = s, s = lt(a, d);
        } else
          t = s, s = r;
        s === r && (s = null), a = Rt(), a !== r ? (m = e, e = ft(s)) : (t = e, e = r);
      } else
        t = e, e = r;
      return e;
    }
    function W() {
      var e, n, s, a;
      return e = t, n = X(), n !== r ? (s = It(), s !== r ? (a = G(), a !== r ? (m = e, e = ot(n, a)) : (t = e, e = r)) : (t = e, e = r)) : (t = e, e = r), e;
    }
    function Vt() {
      var e, n, s, a, d, l, y, _;
      if (e = t, n = Mt(), n !== r) {
        if (s = t, a = G(), a !== r) {
          for (d = [], l = t, y = k(), y !== r ? (_ = G(), _ !== r ? (m = l, l = ue(a, _)) : (t = l, l = r)) : (t = l, l = r); l !== r; )
            d.push(l), l = t, y = k(), y !== r ? (_ = G(), _ !== r ? (m = l, l = ue(a, _)) : (t = l, l = r)) : (t = l, l = r);
          m = s, s = ct(a, d);
        } else
          t = s, s = r;
        s === r && (s = null), a = Pt(), a !== r ? (m = e, e = ut(s)) : (t = e, e = r);
      } else
        t = e, e = r;
      return e;
    }
    function be() {
      var e, n, s, a, d;
      return o++, e = t, n = Bt(), n === r && (n = null), s = Nt(), s !== r ? (a = Kt(), a === r && (a = null), d = Ut(), d === r && (d = null), m = e, e = pt()) : (t = e, e = r), o--, e === r && (n = r, o === 0 && u(Er)), e;
    }
    function kt() {
      var e;
      return i.charCodeAt(t) === 46 ? (e = Ke, t++) : (e = r, o === 0 && u(Pr)), e;
    }
    function Ot() {
      var e;
      return e = i.charAt(t), er.test(e) ? t++ : (e = r, o === 0 && u(Rr)), e;
    }
    function St() {
      var e;
      return e = i.charAt(t), rr.test(e) ? t++ : (e = r, o === 0 && u(Ir)), e;
    }
    function Ut() {
      var e, n, s, a, d;
      if (e = t, n = St(), n !== r) {
        if (s = i.charAt(t), tr.test(s) ? t++ : (s = r, o === 0 && u(Gr)), s === r && (s = null), a = [], d = O(), d !== r)
          for (; d !== r; )
            a.push(d), d = O();
        else
          a = r;
        a !== r ? (n = [n, s, a], e = n) : (t = e, e = r);
      } else
        t = e, e = r;
      return e;
    }
    function Kt() {
      var e, n, s, a;
      if (e = t, n = kt(), n !== r) {
        if (s = [], a = O(), a !== r)
          for (; a !== r; )
            s.push(a), a = O();
        else
          s = r;
        s !== r ? (n = [n, s], e = n) : (t = e, e = r);
      } else
        t = e, e = r;
      return e;
    }
    function Nt() {
      var e, n, s, a;
      if (e = Lt(), e === r)
        if (e = t, n = Ot(), n !== r) {
          for (s = [], a = O(); a !== r; )
            s.push(a), a = O();
          n = [n, s], e = n;
        } else
          t = e, e = r;
      return e;
    }
    function Bt() {
      var e;
      return i.charCodeAt(t) === 45 ? (e = Ne, t++) : (e = r, o === 0 && u(jr)), e;
    }
    function mn() {
      var e;
      return i.charCodeAt(t) === 43 ? (e = Be, t++) : (e = r, o === 0 && u(Dr)), e;
    }
    function Lt() {
      var e;
      return i.charCodeAt(t) === 48 ? (e = Le, t++) : (e = r, o === 0 && u(zr)), e;
    }
    function X() {
      var e, n, s, a;
      if (o++, e = t, n = _e(), n !== r) {
        for (s = [], a = xe(); a !== r; )
          s.push(a), a = xe();
        a = _e(), a !== r ? (m = e, e = gt(s)) : (t = e, e = r);
      } else
        t = e, e = r;
      return o--, e === r && (n = r, o === 0 && u(Vr)), e;
    }
    function xe() {
      var e, n, s, a, d, l, y, _, I, q;
      return e = Zt(), e === r && (e = t, n = Ht(), n !== r ? (s = i.charAt(t), nr.test(s) ? t++ : (s = r, o === 0 && u(kr)), s === r && (s = t, i.charCodeAt(t) === 98 ? (a = He, t++) : (a = r, o === 0 && u(Or)), a !== r && (m = s, a = dt()), s = a, s === r && (s = t, i.charCodeAt(t) === 102 ? (a = Ze, t++) : (a = r, o === 0 && u(Sr)), a !== r && (m = s, a = $t()), s = a, s === r && (s = t, i.charCodeAt(t) === 110 ? (a = We, t++) : (a = r, o === 0 && u(Ur)), a !== r && (m = s, a = vt()), s = a, s === r && (s = t, i.charCodeAt(t) === 114 ? (a = Xe, t++) : (a = r, o === 0 && u(Kr)), a !== r && (m = s, a = ht()), s = a, s === r && (s = t, i.charCodeAt(t) === 116 ? (a = qe, t++) : (a = r, o === 0 && u(Nr)), a !== r && (m = s, a = mt()), s = a, s === r && (s = t, i.charCodeAt(t) === 117 ? (a = Je, t++) : (a = r, o === 0 && u(Br)), a !== r ? (d = t, l = t, y = L(), y !== r ? (_ = L(), _ !== r ? (I = L(), I !== r ? (q = L(), q !== r ? (y = [y, _, I, q], l = y) : (t = l, l = r)) : (t = l, l = r)) : (t = l, l = r)) : (t = l, l = r), l !== r ? d = i.substring(d, t) : d = l, d !== r ? (m = s, s = yt(d)) : (t = s, s = r)) : (t = s, s = r))))))), s !== r ? (m = e, e = bt(s)) : (t = e, e = r)) : (t = e, e = r)), e;
    }
    function Ht() {
      var e;
      return i.charCodeAt(t) === 92 ? (e = Qe, t++) : (e = r, o === 0 && u(Lr)), e;
    }
    function _e() {
      var e;
      return i.charCodeAt(t) === 34 ? (e = Ye, t++) : (e = r, o === 0 && u(Hr)), e;
    }
    function Zt() {
      var e;
      return e = i.charAt(t), sr.test(e) ? t++ : (e = r, o === 0 && u(Zr)), e;
    }
    function O() {
      var e;
      return e = i.charAt(t), ar.test(e) ? t++ : (e = r, o === 0 && u(Wr)), e;
    }
    function L() {
      var e;
      return e = i.charAt(t), ir.test(e) ? t++ : (e = r, o === 0 && u(Xr)), e;
    }
    if (S = $(), f.peg$library)
      return (
        /** @type {any} */
        {
          peg$result: S,
          peg$currPos: t,
          peg$FAILED: r,
          peg$maxFailExpected: N,
          peg$maxFailPos: P
        }
      );
    if (S !== r && t === i.length)
      return S;
    throw S !== r && t < i.length && u(At()), ge(
      N,
      P < i.length ? i.charAt(P) : null,
      P < i.length ? U(P, P + 1) : U(P, P)
    );
  }
  var tn = [
    "start"
  ];

  // src/godot-gridmap/gridmap-parser/gridmap.mts
  function nn(i) {
    let f = [], r = new DataView(i.buffer);
    for (let c = 0; c < i.length; c += 3) {
      let g = c * 4, $ = r.getInt16(g, !0), p = r.getInt16(g + 2, !0), A = r.getInt16(g + 4, !0), F = r.getUint16(g + 8, !0), v = r.getUint16(g + 10, !0), h = v & 31, x = v >> 5;
      f.push({ x: $, y: p, z: A, item: F, rot: h, layer: x });
    }
    return f;
  }
  function Ie(i) {
    let f = new Uint32Array(i.length * 3), r = new DataView(f.buffer);
    for (let c = 0; c < i.length; c++) {
      let g = c * 12, $ = i[c];
      r.setInt16(g, $.x, !0), r.setInt16(g + 2, $.y, !0), r.setInt16(g + 4, $.z, !0), r.setUint16(g + 8, $.item, !0);
      let p = $.rot & 31 | $.layer << 5;
      r.setUint16(g + 10, p, !0);
    }
    return f;
  }
  function sn(i) {
    let f = {};
    return i.props.forEach(([r, c]) => {
      f[r] = c;
    }), f;
  }
  function Pe(i, f, r) {
    return i.filter((c) => c.block.attr.find(([g, $]) => f == g && $ == r));
  }
  function Re(i, f) {
    let r = i.block.attr.find(([c]) => f == c);
    return r ? r[1] : null;
  }
  function an(i) {
    return !!(i && typeof i == "object");
  }
  function Z(i) {
    return !!(i && typeof i == "object" && "method" in i);
  }
  function ln(i) {
    if (Z(i) && i.method == "Transform3D")
      return i.args;
  }
  function fn(i) {
    if (Z(i) && i.method == "Vector3")
      return i.args;
  }
  function on(i) {
    if (i && typeof i == "number")
      return i;
  }
  function Ge(i, f) {
    let r = [];
    try {
      let c = H.parse(f), g = Pe(c, "type", '"GridMap"');
      g.length == 0 ? alert("No GridMaps Found in TSCN File") : g.forEach(($) => {
        let p = "unknown", A = Re($, "name") || "unknown", F = null, v = sn($), h = v.mesh_library;
        if (Z(h)) {
          let { method: T, args: D } = h;
          if (T == "ExtResource") {
            let z = Pe(c, "id", `"${D[0]}"`);
            z[0] && (p = Re(z[0], "path") || "Not Found", p = p.substring(1, p.length - 1));
          }
        }
        let x = v.data;
        if (an(x)) {
          let T = x.cells;
          Z(T) && T.method == "PackedInt32Array" ? F = new Uint32Array(T.args) : alert("Found GridMap, but Data is not in PackedInt32 format");
        }
        let w = fn(v.cell_size) || [1, 1, 1], M = on(v.cell_scale) || 1, E = ln(v.transform) || [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
        if (F) {
          let T = {
            file: i,
            name: A,
            mesh_library: p,
            data: nn(F),
            cell_scale: M,
            cell_size: w,
            transform: E,
            mesh_db: null
          };
          r.push(T);
        }
      });
    } catch (c) {
      console.error(c);
    }
    return r;
  }

  // src/godot-gridmap/convert/tmx_to_gridmap.mts
  function cn(i, f, r, c) {
    let g = c.property(`cell_size:${i}`) || "Vector3(1,1,1)", $ = c.property(`cell_scale:${i}`) || "1", p = c.property(`transform:${i}`) || "Transform3D(1,0,0,0,1,0,0,0,1,0,0,0)", A = Ie(r);
    return `[node name=${i} type="GridMap"]
mesh_library = ExtResource("${f}")
cell_scale = ${$}
cell_size = ${g}
transform = ${p}
data = {
"cells": PackedInt32Array(${A.join(", ")})
}
metadata/_editor_floor_ = Vector3(0, 0, 0)
`;
  }
  function un(i) {
    return [...Array(i)].map(() => Math.random().toString(26)[2]).join("");
  }
  function je(i) {
    let f = {}, r = {}, c = {};
    return i.layers.forEach(($) => {
      if ($.isTileLayer) {
        let p = $.property("gridmap")?.toString() || "", A = i.property(`mesh_library:${p}`)?.toString() || "";
        if (!r[A]) {
          let x = r[A] = `${Object.keys(r).length + 1}_${un(5)}`;
          c[p] = x;
        }
        let F = f[p] = f[p] || [], v = $.property("y"), h = $;
        tiled.log(`Parsing ${$.name}: [${p}] [${A}]`), h.region().rects.forEach((x) => {
          for (let w = x.y; w < x.y + x.height; w++)
            for (let M = x.x; M < x.x + x.width; M++) {
              let E = h.cellAt(M, w);
              if (E.tileId >= 0) {
                let T = E.flippedHorizontally, D = E.flippedVertically, z = E.flippedAntiDiagonally;
                F.push({ x: M, y: v, z: w, item: E.tileId, rot: Me(T, D, z), layer: 0 });
              }
            }
        }), tiled.log(`New GridMap Cell Count: ${F.length}`);
      }
    }), `
[gd_scene load_steps=2 format=3]
${Object.entries(r).map(([$, p]) => `[ext_resource type="MeshLibrary" path="${$}" id="${p}"]`).join(`
`)}
${Object.entries(f).map(([$, p]) => cn($, c[$], p, i)).join(`
`)}`;
  }

  // src/godot-gridmap/godot-gridmap.mts
  tiled.registerMapFormat("GridMap", {
    name: "Godot Gridmap TSCN",
    extension: "tscn",
    write: (i, f) => {
      let r = new TextFile(f, TextFile.WriteOnly), c = je(i);
      return r.write(c), r.commit(), "";
    },
    read: (i) => {
      let f = new TextFile(i, TextFile.ReadOnly), r = Ge(i, f.readAll());
      return Ee(i, r);
    }
  });
})();
