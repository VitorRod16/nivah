import { Users, Calendar, DollarSign, BookOpen, TrendingUp, Clock } from "lucide-react";

const stats = [
  {
    title: "Total Members",
    value: "384",
    change: "+12 this month",
    icon: Users,
    color: "bg-primary",
  },
  {
    title: "Next Event",
    value: "Youth Service",
    change: "March 12, 2026 - 6:00 PM",
    icon: Calendar,
    color: "bg-accent",
  },
  {
    title: "Monthly Offerings",
    value: "$12,450",
    change: "+8% from last month",
    icon: DollarSign,
    color: "bg-green-500",
  },
  {
    title: "Available Studies",
    value: "28",
    change: "3 new this week",
    icon: BookOpen,
    color: "bg-blue-500",
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Sunday Worship Service",
    date: "March 10, 2026",
    time: "10:00 AM",
    attendees: 250,
  },
  {
    id: 2,
    title: "Youth Service",
    date: "March 12, 2026",
    time: "6:00 PM",
    attendees: 85,
  },
  {
    id: 3,
    title: "Bible Study - Book of James",
    date: "March 13, 2026",
    time: "7:00 PM",
    attendees: 42,
  },
  {
    id: 4,
    title: "Prayer Meeting",
    date: "March 15, 2026",
    time: "6:30 AM",
    attendees: 35,
  },
  {
    id: 5,
    title: "Choir Practice",
    date: "March 16, 2026",
    time: "5:00 PM",
    attendees: 28,
  },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your ministry.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="text-sm text-muted-foreground mb-1">{stat.title}</h3>
              <p className="text-2xl font-semibold text-foreground mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Upcoming events */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Upcoming Events</h2>
        </div>
        <div className="divide-y divide-border">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="px-6 py-4 hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">{event.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{event.attendees}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
