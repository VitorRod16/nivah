import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-8 max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl">404</h1>
          <h2>Página não encontrada</h2>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <Link to="/">
          <Button className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Voltar para o Início
          </Button>
        </Link>
      </Card>
    </div>
  );
}
