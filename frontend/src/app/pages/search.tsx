import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search as SearchIcon, MapPin, Church } from 'lucide-react';
import { useMockData } from '../context/MockDataContext';

export function Search() {
  const { ministries } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = ministries.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Buscar Ministérios e Igrejas</h1>
        <p className="text-muted-foreground">Encontre e conecte-se com outras comunidades cristãs</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cidade ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Cadastrados</p>
          <p className="text-2xl mt-1">{ministries.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Resultados</p>
          <p className="text-2xl mt-1">{filtered.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Cidades</p>
          <p className="text-2xl mt-1">{new Set(ministries.map(m => m.city).filter(Boolean)).size}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </p>

        <div className="grid gap-4">
          {filtered.map((ministry) => (
            <Card key={ministry.id} className="p-6">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Church className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{ministry.name}</h3>
                    <Badge variant="secondary">Ministério</Badge>
                  </div>
                  {ministry.description && (
                    <p className="text-sm text-muted-foreground">{ministry.description}</p>
                  )}
                  {ministry.city && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {ministry.city}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-2">
              <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                {ministries.length === 0
                  ? 'Nenhum ministério cadastrado ainda.'
                  : 'Nenhum resultado encontrado para esta busca.'}
              </p>
            </div>
          </Card>
        )}
      </div>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Church className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3>Rede de Ministérios</h3>
            <p className="text-sm text-muted-foreground">
              Busque pelos ministérios e igrejas cadastrados no sistema. Para cadastrar um novo,
              acesse a aba <strong>Ministérios</strong>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
