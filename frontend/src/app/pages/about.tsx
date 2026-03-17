import { MapPin, Phone, Mail, Globe, Heart } from "lucide-react";

export function About() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">About the Ministry</h1>
        <p className="text-muted-foreground mt-1">Learn more about Nivah Church and our mission.</p>
      </div>

      {/* Hero section */}
      <div className="bg-gradient-to-br from-primary to-purple-600 rounded-xl p-8 text-white">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold mb-4">Our Mission</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Nivah Church is dedicated to spreading the Gospel of Jesus Christ, nurturing spiritual growth, 
            and building a community of believers who love God and serve others with compassion and grace.
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Vision */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Our Vision</h3>
          <p className="text-muted-foreground leading-relaxed">
            To be a lighthouse of hope, faith, and love in our community, reaching the lost, 
            restoring the broken, and raising up disciples who will transform the world for Christ.
          </p>
        </div>

        {/* Values */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Our Values</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Faith in God's Word and His promises</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Love for God and our neighbors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Excellence in all we do for His glory</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Unity in Christ and community</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Contact information */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-6">Contact Information</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Address</p>
              <p className="text-sm text-muted-foreground">123 Faith Street<br />Springfield, IL 62701</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Phone</p>
              <p className="text-sm text-muted-foreground">(555) 123-4567</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Email</p>
              <p className="text-sm text-muted-foreground">info@nivahchurch.org</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Website</p>
              <p className="text-sm text-muted-foreground">www.nivahchurch.org</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service times */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-6">Service Times</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-secondary rounded-lg">
            <p className="font-semibold text-foreground mb-1">Sunday Worship</p>
            <p className="text-sm text-muted-foreground">10:00 AM & 6:00 PM</p>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <p className="font-semibold text-foreground mb-1">Wednesday Bible Study</p>
            <p className="text-sm text-muted-foreground">7:00 PM</p>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <p className="font-semibold text-foreground mb-1">Friday Prayer</p>
            <p className="text-sm text-muted-foreground">6:30 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
