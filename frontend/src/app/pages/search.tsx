import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Search as SearchIcon, MapPin, Users, Church, Mail, Phone } from 'lucide-react';

// Mock churches/ministries data
const mockChurches = [
  {
    id: 1,
    name: 'Igreja Evangélica Comunidade',
    city: 'São Paulo',
    state: 'SP',
    type: 'Igreja',
    members: 350,
    pastor: 'Pastor Carlos Mendes',
    email: 'contato@iecomunidade.com',
    phone: '(11) 98888-1111',
    address: 'Rua das Flores, 500 - Jardim Paulista',
    description: 'Igreja evangélica focada em família e comunidade.'
  },
  {
    id: 2,
    name: 'Ministério Vida Nova',
    city: 'Rio de Janeiro',
    state: 'RJ',
    type: 'Ministério',
    members: 280,
    pastor: 'Pastora Ana Rodrigues',
    email: 'ministerio@vidanova.com',
    phone: '(21) 97777-2222',
    address: 'Av. Atlântica, 1200 - Copacabana',
    description: 'Ministério voltado para restauração e cura interior.'
  },
  {
    id: 3,
    name: 'Igreja Batista Central',
    city: 'Belo Horizonte',
    state: 'MG',
    type: 'Igreja',
    members: 520,
    pastor: 'Pastor Fernando Santos',
    email: 'ibc@central.com.br',
    phone: '(31) 96666-3333',
    address: 'Praça da Liberdade, 80 - Centro',
    description: 'Igreja batista tradicional com forte atuação social.'
  },
  {
    id: 4,
    name: 'Comunidade Cristã Renascer',
    city: 'Curitiba',
    state: 'PR',
    type: 'Comunidade',
    members: 180,
    pastor: 'Pastor Roberto Lima',
    email: 'contato@renascer.org',
    phone: '(41) 95555-4444',
    address: 'Rua XV de Novembro, 300 - Centro',
    description: 'Comunidade jovem e dinâmica focada em evangelismo.'
  },
  {
    id: 5,
    name: 'Igreja Presbiteriana da Paz',
    city: 'Porto Alegre',
    state: 'RS',
    type: 'Igreja',
    members: 420,
    pastor: 'Pastor Marcos Oliveira',
    email: 'ipp@dapaz.com.br',
    phone: '(51) 94444-5555',
    address: 'Av. Independência, 950 - Moinhos de Vento',
    description: 'Igreja presbiteriana com foco em ensino bíblico.'
  },
  {
    id: 6,
    name: 'Ministério Adoração e Vida',
    city: 'Brasília',
    state: 'DF',
    type: 'Ministério',
    members: 220,
    pastor: 'Pastora Juliana Costa',
    email: 'ministerio@adoracaoevida.com',
    phone: '(61) 93333-6666',
    address: 'SQN 305, Bloco A - Asa Norte',
    description: 'Ministério focado em adoração e vida devocional.'
  },
];

export function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredChurches = mockChurches.filter(church => {
    const matchesSearch = 
      church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.pastor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || church.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Buscar Ministérios e Igrejas</h1>
        <p className="text-muted-foreground">Encontre e conecte-se com outras comunidades cristãs</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade, pastor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Todos
          </Button>
          <Button
            variant={filterType === 'Igreja' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('Igreja')}
          >
            Igrejas
          </Button>
          <Button
            variant={filterType === 'Ministério' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('Ministério')}
          >
            Ministérios
          </Button>
          <Button
            variant={filterType === 'Comunidade' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('Comunidade')}
          >
            Comunidades
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Cadastrados</p>
          <p className="text-2xl mt-1">{mockChurches.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Igrejas</p>
          <p className="text-2xl mt-1">{mockChurches.filter(c => c.type === 'Igreja').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ministérios</p>
          <p className="text-2xl mt-1">{mockChurches.filter(c => c.type === 'Ministério').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Estados</p>
          <p className="text-2xl mt-1">{new Set(mockChurches.map(c => c.state)).size}</p>
        </Card>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredChurches.length} {filteredChurches.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </p>
        </div>

        <div className="grid gap-4">
          {filteredChurches.map((church) => (
            <Card key={church.id} className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex gap-4 items-start flex-1">
                    <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Church className="w-7 h-7 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3>{church.name}</h3>
                        <Badge variant="secondary">{church.type}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{church.description}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {church.city}, {church.state}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {church.members} membros
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline">Ver Detalhes</Button>
                </div>

                <div className="pt-3 border-t grid md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Pastor/Líder</p>
                    <p className="font-medium">{church.pastor}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Endereço</p>
                    <p className="text-sm">{church.address}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">{church.email}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs">{church.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredChurches.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-2">
              <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Nenhum resultado encontrado</p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros ou termos de busca
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Church className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3>Rede de Igrejas e Ministérios</h3>
            <p className="text-sm text-muted-foreground">
              Esta ferramenta permite encontrar e conectar-se com outras igrejas e ministérios 
              cristãos em todo o Brasil. Você pode buscar por nome, localização ou tipo de 
              organização. Use esta rede para estabelecer parcerias, compartilhar recursos e 
              fortalecer o corpo de Cristo.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
