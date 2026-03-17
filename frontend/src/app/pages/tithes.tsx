import { QrCode, Copy, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const transactions = [
  { id: 1, type: "income", description: "Sunday Offerings", amount: 3250, date: "Mar 10, 2026" },
  { id: 2, type: "income", description: "Online Tithes", amount: 1850, date: "Mar 8, 2026" },
  { id: 3, type: "expense", description: "Building Maintenance", amount: -450, date: "Mar 7, 2026" },
  { id: 4, type: "income", description: "Special Offering", amount: 2100, date: "Mar 6, 2026" },
  { id: 5, type: "expense", description: "Utilities Payment", amount: -320, date: "Mar 5, 2026" },
  { id: 6, type: "income", description: "Sunday Offerings", amount: 2980, date: "Mar 3, 2026" },
  { id: 7, type: "expense", description: "Ministry Supplies", amount: -180, date: "Mar 2, 2026" },
  { id: 8, type: "income", description: "Online Tithes", amount: 1640, date: "Mar 1, 2026" },
];

const summary = {
  totalIncome: 11820,
  totalExpenses: 950,
  balance: 10870,
};

export function Tithes() {
  const pixKey = "nivah@church.org";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Tithes and Offerings</h1>
        <p className="text-muted-foreground mt-1">Manage donations and financial records.</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-foreground">${summary.totalIncome.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">This month</p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-foreground">${summary.totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-red-600 mt-1">This month</p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Balance</p>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-foreground">${summary.balance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Net this month</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* PIX donation */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Donate via PIX</h3>
          
          {/* QR Code placeholder */}
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg p-8 mb-4 flex items-center justify-center">
            <QrCode className="w-32 h-32 text-primary" />
          </div>

          {/* PIX key */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">PIX Key</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={pixKey}
                readOnly
                className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                title="Copy PIX key"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Scan the QR code or copy the PIX key to make your donation
          </p>
        </div>

        {/* Transactions table */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {transaction.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {transaction.date}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
