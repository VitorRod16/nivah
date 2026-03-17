import { Card } from '../components/ui/card';
import { Church, Heart, Target } from 'lucide-react';
import logoImg from 'figma:asset/53ef4314c936ceb2d472946a347e2bbb419189ab.png';

export function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 flex items-center justify-center">
            <img src={logoImg} alt="Nivah Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="text-4xl">Igreja Cristã Nivah</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Uma comunidade de fé comprometida com o amor, a verdade e o serviço ao próximo.
        </p>
      </div>

      {/* Quem Somos */}
      <section className="space-y-4">
        <h2>Quem Somos</h2>
        <Card className="p-6">
          <p className="text-muted-foreground leading-relaxed">
            A Igreja Cristã Niva nasceu do desejo de criar um espaço onde todos possam experimentar 
            o amor transformador de Cristo. Somos uma comunidade acolhedora que busca viver os 
            ensinamentos bíblicos de forma prática e relevante para os dias atuais. Nossa missão 
            é alcançar vidas, edificar discípulos e impactar a sociedade através do evangelho.
          </p>
        </Card>
      </section>

      {/* Nosso Propósito */}
      <section className="space-y-4">
        <h2>Nosso Propósito</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3>Amar a Deus</h3>
            <p className="text-sm text-muted-foreground">
              Cultivar uma relação íntima com Deus através da adoração, oração e estudo da Palavra.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3>Servir ao Próximo</h3>
            <p className="text-sm text-muted-foreground">
              Demonstrar o amor de Cristo através de ações práticas que transformam vidas.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Church className="w-6 h-6 text-primary" />
            </div>
            <h3>Edificar a Igreja</h3>
            <p className="text-sm text-muted-foreground">
              Formar discípulos maduros e capacitar líderes para expandir o Reino de Deus.
            </p>
          </Card>
        </div>
      </section>

      {/* Pastoreio Atual */}
      <section className="space-y-4">
        <h2>Pastoreio Atual</h2>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">👨‍👩‍👧‍👦</span>
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3>Pastor João Silva e Pastora Maria Silva</h3>
              <p className="text-muted-foreground">
                Nossos pastores principais, servindo a igreja desde 2015. Com corações voltados 
                para o cuidado pastoral e ensino da Palavra, eles lideram nossa comunidade com 
                amor, sabedoria e dedicação.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Pastor Titular
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Pastora Auxiliar
                </span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Nossa Visão */}
      <section className="space-y-4">
        <h2>Nossa Visão</h2>
        <Card className="p-6 bg-primary text-primary-foreground">
          <p className="text-center text-lg leading-relaxed">
            "Ser uma igreja que transforma vidas através do evangelho, formando discípulos 
            comprometidos com Cristo e impactando nossa comunidade com amor e verdade."
          </p>
        </Card>
      </section>
    </div>
  );
}