import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router";
import { Card } from "../components/ui/card";
import { Church, Lock, Mail, User, Building, Search, CheckCircle2, ArrowRight, Plus, Eye, EyeOff, Phone } from "lucide-react";
import logoImg from "../../assets/53ef4314c936ceb2d472946a347e2bbb419189ab.png";
import { toast } from "sonner";

const BASE_URL = "http://localhost:8080/api";

type IgrejaOption = { id: string; nome: string; cidade?: string; isPending?: boolean };

export function Login() {
  const { login, register, finalizeAuth, isAuthenticated } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [isSelectingIgreja, setIsSelectingIgreja] = useState(false);
  const [isAddingNewIgreja, setIsAddingNewIgreja] = useState(false);

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

  // Igreja states
  const [igrejas, setIgrejas] = useState<IgrejaOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIgrejaId, setSelectedIgrejaId] = useState<string | null>(null);
  const [pendingNewIgreja, setPendingNewIgreja] = useState<{ nome: string; cidade: string } | null>(null);

  // New Igreja form states
  const [newIgrejaNome, setNewIgrejaNome] = useState("");
  const [newIgrejaCidade, setNewIgrejaCidade] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing igrejas when entering the selection step (endpoint is public)
  useEffect(() => {
    if (!isSelectingIgreja) return;
    fetch(`${BASE_URL}/igrejas`)
      .then(r => (r.ok ? r.json() : []))
      .then((data: any[]) => setIgrejas(data.map(i => ({ id: i.id, nome: i.nome, cidade: i.cidade }))))
      .catch(() => setIgrejas([]));
  }, [isSelectingIgreja]);

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

    setIsSelectingIgreja(true);
  };

  const handleFinishRegistration = async () => {
    if (!selectedIgrejaId) {
      toast.error("Selecione ou cadastre uma igreja para se vincular.");
      return;
    }

    setIsSubmitting(true);
    const isNewIgreja = selectedIgrejaId === "pending-new";
    const toastId = toast.loading("Criando conta...");

    // Se está criando uma nova igreja, registra como PASTOR; caso contrário, como MEMBRO
    const role = isNewIgreja ? "PASTOR" : "MEMBRO";
    const result = await register(name, email, password, role);
    if (!result.success) {
      toast.error(result.error || "Erro ao criar conta.", { id: toastId });
      setIsSubmitting(false);
      return;
    }

    const { token, userData } = result;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    let igrejaId = selectedIgrejaId;

    // Se é uma nova igreja, cria ela agora (o serviço já vincula o PASTOR automaticamente)
    if (isNewIgreja && pendingNewIgreja) {
      try {
        const res = await fetch(`${BASE_URL}/igrejas`, {
          method: "POST",
          headers,
          body: JSON.stringify({ nome: pendingNewIgreja.nome, cidade: pendingNewIgreja.cidade }),
        });
        const created = await res.json();
        igrejaId = created.id;
      } catch {
        igrejaId = "";
      }
    }

    // Vincula o usuário à igreja como membro
    if (igrejaId && igrejaId !== "pending-new") {
      try {
        await fetch(`${BASE_URL}/membros`, {
          method: "POST",
          headers,
          body: JSON.stringify({ email, igrejaId, phone: phone || undefined }),
        });
      } catch {
        // Non-critical — user account was created successfully
      }
    }

    toast.success("Conta criada com sucesso! Bem-vindo ao Nivah.", { id: toastId });
    setIsSubmitting(false);
    finalizeAuth(userData!, token!);
  };

  const handleAddNewIgreja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIgrejaNome || !newIgrejaCidade) return;

    const tempId = "pending-new";
    setPendingNewIgreja({ nome: newIgrejaNome, cidade: newIgrejaCidade });
    setIgrejas(prev => [
      ...prev.filter(i => i.id !== tempId),
      { id: tempId, nome: newIgrejaNome, cidade: newIgrejaCidade, isPending: true },
    ]);
    setSelectedIgrejaId(tempId);
    setNewIgrejaNome("");
    setNewIgrejaCidade("");
    setIsAddingNewIgreja(false);
    setSearchQuery("");
  };

  const filteredIgrejas = igrejas.filter(i =>
    i.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.cidade ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <img src={logoImg} alt="Niva Logo" className="w-16 h-16 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            {isSelectingIgreja
              ? "Sua Igreja"
              : isRegistering
                ? "Crie sua Conta"
                : "Bem-vindo ao Nivah"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isSelectingIgreja
              ? "Selecione ou cadastre a igreja à qual você pertence"
              : isRegistering
                ? "Cadastre-se para acessar o sistema da sua igreja"
                : "Faça login para acessar o sistema"}
          </p>
        </div>

        <Card className="p-8 border-primary/20 shadow-lg relative overflow-hidden">
          {!isRegistering && !isSelectingIgreja && (
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

          {isRegistering && !isSelectingIgreja && (
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

          {isSelectingIgreja && (
            // Step 2: Select Igreja
            <div className="space-y-4 animate-in slide-in-from-right-8 fade-in">
              {!isAddingNewIgreja ? (
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
                      placeholder="Buscar igreja pelo nome ou cidade..."
                    />
                  </div>

                  <div className="mt-4 border rounded-md max-h-[250px] overflow-y-auto bg-muted/20">
                    {filteredIgrejas.length > 0 ? (
                      <ul className="divide-y">
                        {filteredIgrejas.map((igreja) => (
                          <li key={igreja.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedIgrejaId(igreja.id)}
                              className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors ${
                                selectedIgrejaId === igreja.id ? "bg-primary/5" : ""
                              }`}
                            >
                              <div>
                                <p className="font-medium text-foreground">
                                  {igreja.nome}
                                  {igreja.isPending && <span className="ml-2 text-xs text-primary">(nova)</span>}
                                </p>
                                <p className="text-xs text-muted-foreground">{igreja.cidade}</p>
                              </div>
                              {selectedIgrejaId === igreja.id && (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        <p>Nenhuma igreja encontrada.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewIgreja(true)}
                      className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Não encontrou sua igreja? Cadastrar nova
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSelectingIgreja(false)}
                      className="px-4 py-2.5 border rounded-md hover:bg-muted focus:outline-none font-medium transition-colors text-foreground"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishRegistration}
                      disabled={!selectedIgrejaId || isSubmitting}
                      className="flex-1 py-2.5 px-4 bg-[#0000FF] text-white rounded-md hover:bg-[#0000CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0000FF] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSubmitting ? "Criando conta..." : "Finalizar Cadastro"}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleAddNewIgreja} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome da Igreja</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Church className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        required
                        type="text"
                        value={newIgrejaNome}
                        onChange={(e) => setNewIgrejaNome(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder="Ex: Primeira Igreja Batista..."
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
                        value={newIgrejaCidade}
                        onChange={(e) => setNewIgrejaCidade(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder="Ex: São Paulo, SP"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Ao cadastrar uma nova igreja você será registrado como pastor responsável.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewIgreja(false)}
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

          {!isSelectingIgreja && (
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