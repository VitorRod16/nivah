import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router";
import { Card } from "../components/ui/card";
import { Church, Lock, Mail, User, Building, Search, CheckCircle2, ArrowRight, Plus, Eye, EyeOff, Phone } from "lucide-react";
import logoImg from "../../assets/53ef4314c936ceb2d472946a347e2bbb419189ab.png";
import { toast } from "sonner";

const BASE_URL = "http://localhost:8080/api";

type MinistryOption = { id: string; name: string; city: string; isPending?: boolean };

export function Login() {
  const { login, register, finalizeAuth, isAuthenticated } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [isSelectingMinistry, setIsSelectingMinistry] = useState(false);
  const [isAddingNewMinistry, setIsAddingNewMinistry] = useState(false);

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ministry states (loaded directly, no context needed)
  const [ministries, setMinistries] = useState<MinistryOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  // Pending new ministry is deferred: created after registration (when we have a token)
  const [pendingNewMinistry, setPendingNewMinistry] = useState<{ name: string; city: string } | null>(null);

  // New Ministry form states
  const [newMinistryName, setNewMinistryName] = useState("");
  const [newMinistryCity, setNewMinistryCity] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing ministries when entering the ministry selection step (endpoint is public)
  useEffect(() => {
    if (!isSelectingMinistry) return;
    fetch(`${BASE_URL}/ministries`)
      .then(r => (r.ok ? r.json() : []))
      .then(setMinistries)
      .catch(() => setMinistries([]));
  }, [isSelectingMinistry]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error || "Erro ao fazer login");
    }
  };

  const handleRegisterPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setIsSelectingMinistry(true);
  };

  const handleFinishRegistration = async () => {
    if (selectedMinistries.length === 0) {
      toast.error("Selecione pelo menos um ministério para se vincular.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Criando conta e vinculando ao ministério...");

    // register() now returns token + userData WITHOUT triggering navigation yet.
    // This lets us finish creating ministry/member before MockDataProvider loads.
    const result = await register(name, email, password);
    if (!result.success) {
      toast.error(result.error || "Erro ao criar conta.", { id: toastId });
      setIsSubmitting(false);
      return;
    }

    const { token, userData } = result;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    // Determine the ministry ID to link the member to
    let ministryId = selectedMinistries[0];

    // If there's a pending new ministry (created before auth), create it now
    if (pendingNewMinistry && ministryId === "pending-new") {
      try {
        const res = await fetch(`${BASE_URL}/ministries`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: pendingNewMinistry.name,
            city: pendingNewMinistry.city,
            description: "Cadastrado via formulário de registro",
          }),
        });
        const created = await res.json();
        ministryId = created.id;
      } catch {
        ministryId = "";
      }
    }

    // Create the member record linked to the chosen ministry
    try {
      await fetch(`${BASE_URL}/members`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, email, phone, ministryId: ministryId || undefined }),
      });
    } catch {
      // Non-critical — user account was created successfully
    }

    toast.success("Conta criada com sucesso! Bem-vindo ao Nivah.", { id: toastId });
    setIsSubmitting(false);

    // Only NOW trigger navigation — ministry and member are already in the DB,
    // so when MockDataProvider loads its data everything will be visible.
    finalizeAuth(userData!, token!);
  };

  const handleAddNewMinistry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMinistryName || !newMinistryCity) return;

    // Store the data locally — the ministry will be created after registration (needs auth token)
    const tempId = "pending-new";
    setPendingNewMinistry({ name: newMinistryName, city: newMinistryCity });
    setMinistries(prev => [
      ...prev.filter(m => m.id !== tempId),
      { id: tempId, name: newMinistryName, city: newMinistryCity, isPending: true },
    ]);
    setSelectedMinistries(prev => [...prev.filter(id => id !== tempId), tempId]);
    setNewMinistryName("");
    setNewMinistryCity("");
    setIsAddingNewMinistry(false);
    setSearchQuery("");
  };

  const toggleMinistrySelection = (id: string) => {
    setSelectedMinistries(prev => 
      prev.includes(id) 
        ? prev.filter(mId => mId !== id)
        : [...prev, id]
    );
  };

  const filteredMinistries = ministries.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <img src={logoImg} alt="Niva Logo" className="w-16 h-16 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            {isSelectingMinistry 
              ? "Vínculo Ministerial" 
              : isRegistering 
                ? "Crie sua Conta" 
                : "Bem-vindo ao Nivah"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isSelectingMinistry
              ? "Selecione os ministérios dos quais você faz parte"
              : isRegistering 
                ? "Cadastre-se para acessar o sistema da sua igreja" 
                : "Faça login para acessar o sistema"}
          </p>
        </div>

        <Card className="p-8 border-primary/20 shadow-lg relative overflow-hidden">
          {!isRegistering && !isSelectingMinistry && (
            // Login Form
            <form onSubmit={handleLoginSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Senha</label>
                  <button type="button" className="text-xs text-primary hover:underline focus:outline-none">
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#0000FF] text-white rounded-md hover:bg-[#0000CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0000FF] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </button>
            </form>
          )}

          {isRegistering && !isSelectingMinistry && (
            // Step 1: Register Person Form
            <form onSubmit={handleRegisterPersonSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder="João da Silva"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder="joao@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmar Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#0000FF] text-white rounded-md hover:bg-[#0000CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0000FF] font-medium transition-colors mt-4 flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {isSelectingMinistry && (
            // Step 2: Select Ministry
            <div className="space-y-4 animate-in slide-in-from-right-8 fade-in">
              {!isAddingNewMinistry ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="Buscar ministério pelo nome..."
                    />
                  </div>

                  <div className="mt-4 border rounded-md max-h-[250px] overflow-y-auto bg-muted/20">
                    {filteredMinistries.length > 0 ? (
                      <ul className="divide-y">
                        {filteredMinistries.map((ministry) => (
                          <li key={ministry.id}>
                            <button
                              type="button"
                              onClick={() => toggleMinistrySelection(ministry.id)}
                              className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors ${
                                selectedMinistries.includes(ministry.id) ? "bg-primary/5" : ""
                              }`}
                            >
                              <div>
                                <p className="font-medium text-foreground">{ministry.name}</p>
                                <p className="text-xs text-muted-foreground">{ministry.city}</p>
                              </div>
                              {selectedMinistries.includes(ministry.id) && (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                        <p>Nenhum ministério encontrado com este nome.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewMinistry(true)}
                      className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> 
                      Não encontrou sua igreja? Cadastrar nova
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSelectingMinistry(false)}
                      className="px-4 py-2.5 border rounded-md hover:bg-muted focus:outline-none font-medium transition-colors text-foreground"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishRegistration}
                      disabled={selectedMinistries.length === 0 || isSubmitting}
                      className="flex-1 py-2.5 px-4 bg-[#0000FF] text-white rounded-md hover:bg-[#0000CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0000FF] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSubmitting ? "Criando conta..." : "Finalizar Cadastro"}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleAddNewMinistry} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome da Igreja/Ministério</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Church className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        required
                        type="text"
                        value={newMinistryName}
                        onChange={(e) => setNewMinistryName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder="Ex: Primeira Igreja..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cidade / Estado</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        required
                        type="text"
                        value={newMinistryCity}
                        onChange={(e) => setNewMinistryCity(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder="Ex: São Paulo, SP"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewMinistry(false)}
                      className="px-4 py-2.5 border rounded-md hover:bg-muted focus:outline-none font-medium transition-colors text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-[#0000FF] text-white rounded-md hover:bg-[#0000CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0000FF] font-medium transition-colors flex items-center justify-center"
                    >
                      Cadastrar e Selecionar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {!isSelectingMinistry && (
            <div className="mt-6 text-center text-sm text-muted-foreground border-t pt-6">
              {!isRegistering ? (
                <>
                  Não tem uma conta?{" "}
                  <button
                    onClick={() => setIsRegistering(true)}
                    className="text-primary font-medium hover:underline focus:outline-none"
                  >
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já possui uma conta?{" "}
                  <button
                    onClick={() => setIsRegistering(false)}
                    className="text-primary font-medium hover:underline focus:outline-none"
                  >
                    Fazer login
                  </button>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}