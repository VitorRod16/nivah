import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMockData } from "../context/MockDataContext";
import { Navigate } from "react-router";
import { Card } from "../components/ui/card";
import { Church, Lock, Mail, User, Building, Search, CheckCircle2, ArrowRight, Plus } from "lucide-react";
import logoImg from "figma:asset/53ef4314c936ceb2d472946a347e2bbb419189ab.png";

export function Login() {
  const { login, register, isAuthenticated } = useAuth();
  const { ministries, addMinistry, addMember } = useMockData();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSelectingMinistry, setIsSelectingMinistry] = useState(false);
  const [isAddingNewMinistry, setIsAddingNewMinistry] = useState(false);
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register states
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Ministry Selection states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  
  // New Ministry states
  const [newMinistryName, setNewMinistryName] = useState("");
  const [newMinistryCity, setNewMinistryCity] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || "Erro ao fazer login");
    }
  };

  const handleRegisterPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    // Move to ministry selection step
    setIsSelectingMinistry(true);
  };

  const handleFinishRegistration = async () => {
    if (selectedMinistries.length === 0) {
      setError("Selecione pelo menos um ministério para se vincular.");
      return;
    }

    setError("");
    setSuccessMsg("Criando conta e vinculando aos ministérios...");
    
    // Save the new user correctly using the context's register function
    const result = await register(name, email, password);
    
    if (result && !result.success) {
      setError(result.error || "Erro ao criar conta.");
      setSuccessMsg("");
      return;
    }
    
    // Auto-create as Member
    addMember({
      name: name,
      email: email,
      phone: "",
      ministryId: selectedMinistries[0] // pick the first one
    });

    setSuccessMsg("Conta criada e vinculada com sucesso! Redirecionando...");
  };

  const handleAddNewMinistry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMinistryName) return;
    
    const newId = addMinistry({
      name: newMinistryName,
      city: newMinistryCity,
      description: "Cadastrado via formulário de registro"
    });
    
    setSelectedMinistries(prev => [...prev, newId]);
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
          {successMsg && (
            <div className="mb-6 p-3 bg-green-100 border border-green-300 text-green-800 text-sm rounded-md text-center font-medium">
              {successMsg}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">
              {error}
            </div>
          )}

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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#0000FF] text-white rounded-md hover:bg-[#0000CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0000FF] font-medium transition-colors flex items-center justify-center gap-2"
              >
                Entrar
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmar Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="••••••••"
                    />
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
                      disabled={selectedMinistries.length === 0 || !!successMsg}
                      className="flex-1 py-2.5 px-4 bg-[#0000FF] text-white rounded-md hover:bg-[#0000CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0000FF] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      Finalizar Cadastro
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
                    onClick={() => {
                      setIsRegistering(true);
                      setError("");
                    }} 
                    className="text-primary font-medium hover:underline focus:outline-none"
                  >
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já possui uma conta?{" "}
                  <button 
                    onClick={() => {
                      setIsRegistering(false);
                      setError("");
                    }} 
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