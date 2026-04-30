

    // 2. Check muvveqetiParol from DavetEdilmisIstifadeci
    const matchedUser = davetler.find(
      d => d.muvveqetiParol && d.muvveqetiParol === password && d.status !== "Bloklandı" && d.status !== "Deaktiv"
    );

    if (matchedUser) {
      sessionStorage.setItem("gms_sys_auth", "1");
      sessionStorage.setItem("gms_sys_user", JSON.stringify({
        email: matchedUser.email,
        ad_soyad: matchedUser.ad_soyad,
        rol: matchedUser.rol,
        id: matchedUser.id,
        modul_erisimi: matchedUser.modul_erisimi || [],
      }));
      setLoading(false);
      onSuccess();
      return;
    }

    setError("Şifrə yanlışdır. Yenidən cəhd edin.");
    setPassword("");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-[9999]">
      <div className="w-full max-w-sm mx-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GMS ERP</h1>
          <p className="text-slate-400 text-sm mt-1">İdarəetmə Sistemi</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-1">Sisteme Giriş</h2>
          <p className="text-slate-400 text-sm mb-6">Daxil olmaq üçün sistem şifrəsini daxil edin</p>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Sistem şifrəsi</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary"
                />
                <button
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-10"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Yoxlanılır..." : "Daxil ol"}
            </Button>
          </div>

          <p className="text-slate-500 text-xs text-center mt-4">
            Parolunuzu unutmusunuzsa, sistem admininizlə əlaqə saxlayın.
          </p>
          <p className="text-slate-600 text-xs text-center mt-1">
            GMS ERP • Məxfi sistem — icazəsiz giriş qadağandır
          </p>
        </div>
      </div>
    </div>
  );
}