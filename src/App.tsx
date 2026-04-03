import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Table as TableIcon, 
  FileText, 
  Download, 
  ArrowRightLeft,
  Info,
  History,
  Sun,
  Moon,
  Wallet,
  PiggyBank,
  BarChart3
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  calculateLoan, 
  generateAmortizationSchedule, 
  calculateFD, 
  calculateRD,
  LoanInputs,
  InterestType,
  TenureUnit,
  CompoundingFrequency,
  LoanType,
  LOAN_DEFAULTS
} from './lib/finance';
import { formatCurrency, formatPercent, cn } from './lib/utils';
import { exportToExcel, generateKFSPDF } from './lib/export';

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "bg-white dark:bg-slate-900/40 dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/60 shadow-sm overflow-hidden transition-all duration-300", 
    className
  )}>
    {children}
  </div>
);

const InputGroup = ({ label, children, icon: Icon }: { label: string; children: React.ReactNode; icon?: any }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-blue-500" />}
      {label}
    </label>
    {children}
  </div>
);

const TabButton = ({ active, onClick, children, icon: Icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: any }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all border-b-2",
      active 
        ? "text-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20" 
        : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
    )}
  >
    <Icon size={18} />
    {children}
  </button>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'loan' | 'investment' | 'affordability' | 'comparison'>('loan');
  const [darkMode, setDarkMode] = useState(false);

  // Loan State
  const [loanInputs, setLoanInputs] = useState<LoanInputs>({
    type: 'home',
    amount: 1000000,
    rate: 8.5,
    tenure: 10,
    tenureUnit: 'years',
    interestType: 'reducing',
    processingFee: 0.5,
    processingFeeType: 'percentage',
    insurance: 5000,
    moratorium: 0
  });

  const handleLoanTypeChange = (type: LoanType) => {
    const defaults = LOAN_DEFAULTS[type];
    setLoanInputs({
      ...loanInputs,
      type,
      rate: defaults.rate,
      tenure: defaults.tenure,
      tenureUnit: 'years'
    });
  };
  const [borrowerName, setBorrowerName] = useState('John Doe');

  // FD/RD State
  const [fdInputs, setFdInputs] = useState({ amount: 500000, rate: 7, tenure: 5, frequency: 'quarterly' as CompoundingFrequency });
  const [rdInputs, setRdInputs] = useState({ monthly: 10000, rate: 6.5, tenure: 36 });

  // Affordability State
  const [salary, setSalary] = useState(100000);
  const [expenses, setExpenses] = useState(40000);

  // Calculations
  const loanResult = useMemo(() => calculateLoan(loanInputs), [loanInputs]);
  const flatLoanResult = useMemo(() => calculateLoan({ ...loanInputs, interestType: 'flat' }), [loanInputs]);
  const schedule = useMemo(() => generateAmortizationSchedule(loanInputs), [loanInputs]);
  const fdResult = useMemo(() => calculateFD(fdInputs.amount, fdInputs.rate, fdInputs.tenure, fdInputs.frequency), [fdInputs]);
  const rdResult = useMemo(() => calculateRD(rdInputs.monthly, rdInputs.rate, rdInputs.tenure), [rdInputs]);

  const pieData = [
    { name: 'Principal', value: loanInputs.amount },
    { name: 'Interest', value: loanResult.totalInterest },
    { name: 'Fees & Insurance', value: loanResult.processingFeeAmount + loanInputs.insurance },
  ];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981'];

  const maxEMI = (salary - expenses) * 0.5; // 50% of disposable income
  const isAffordable = loanResult.emi <= maxEMI;

  return (
    <div className={cn("min-h-screen transition-colors duration-500", darkMode ? "dark bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-900")}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FinPlan Pro</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">Financial Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
            <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <TabButton active={activeTab === 'loan'} onClick={() => setActiveTab('loan')} icon={Calculator}>Loans</TabButton>
              <TabButton active={activeTab === 'investment'} onClick={() => setActiveTab('investment')} icon={PiggyBank}>Investments</TabButton>
              <TabButton active={activeTab === 'affordability'} onClick={() => setActiveTab('affordability')} icon={Wallet}>Affordability</TabButton>
              <TabButton active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')} icon={ArrowRightLeft}>Compare</TabButton>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden flex overflow-x-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
        <TabButton active={activeTab === 'loan'} onClick={() => setActiveTab('loan')} icon={Calculator}>Loans</TabButton>
        <TabButton active={activeTab === 'investment'} onClick={() => setActiveTab('investment')} icon={PiggyBank}>Investments</TabButton>
        <TabButton active={activeTab === 'affordability'} onClick={() => setActiveTab('affordability')} icon={Wallet}>Affordability</TabButton>
        <TabButton active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')} icon={ArrowRightLeft}>Compare</TabButton>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'loan' && (
            <motion.div 
              key="loan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Inputs */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Calculator className="text-blue-600" size={20} />
                      Loan Parameters
                    </h2>
                  </div>

                  <InputGroup label="Loan Type">
                    <select 
                      value={loanInputs.type}
                      onChange={(e) => handleLoanTypeChange(e.target.value as LoanType)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                    >
                      <option value="home">Home Loan</option>
                      <option value="personal">Personal Loan</option>
                      <option value="gold">Gold Loan</option>
                      <option value="car">Car Loan</option>
                      <option value="education">Education Loan</option>
                    </select>
                  </InputGroup>

                  <InputGroup label="Borrower Name">
                    <input 
                      type="text" 
                      value={borrowerName} 
                      onChange={(e) => setBorrowerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </InputGroup>

                  <InputGroup label="Loan Amount (₹)">
                    <input 
                      type="number" 
                      value={loanInputs.amount} 
                      onChange={(e) => setLoanInputs({ ...loanInputs, amount: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </InputGroup>

                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Interest Rate (%)">
                      <input 
                        type="number" 
                        step="0.1"
                        value={loanInputs.rate} 
                        onChange={(e) => setLoanInputs({ ...loanInputs, rate: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </InputGroup>
                    <InputGroup label="Tenure">
                      <div className="flex">
                        <input 
                          type="number" 
                          value={loanInputs.tenure} 
                          onChange={(e) => setLoanInputs({ ...loanInputs, tenure: Number(e.target.value) })}
                          className="w-full px-4 py-2.5 rounded-l-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <select 
                          value={loanInputs.tenureUnit}
                          onChange={(e) => setLoanInputs({ ...loanInputs, tenureUnit: e.target.value as TenureUnit })}
                          className="px-2 py-2.5 rounded-r-xl border-y border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs outline-none"
                        >
                          <option value="years">Yrs</option>
                          <option value="months">Mos</option>
                        </select>
                      </div>
                    </InputGroup>
                  </div>

                  <InputGroup label="Interest Type">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <button 
                        onClick={() => setLoanInputs({ ...loanInputs, interestType: 'reducing' })}
                        className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", loanInputs.interestType === 'reducing' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500")}
                      >
                        Reducing
                      </button>
                      <button 
                        onClick={() => setLoanInputs({ ...loanInputs, interestType: 'flat' })}
                        className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", loanInputs.interestType === 'flat' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500")}
                      >
                        Flat
                      </button>
                    </div>
                  </InputGroup>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <button 
                      onClick={() => generateKFSPDF(loanInputs, loanResult, borrowerName)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Download size={18} />
                      Download KFS (PDF)
                    </button>
                  </div>
                </Card>

                <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-start gap-3">
                    <Info className="text-blue-600 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">Pro Tip</h3>
                      <p className="text-sm text-blue-800/70 dark:text-blue-200/60 leading-relaxed mt-1">
                        Reducing balance interest is generally cheaper than flat interest for the same ROI. Check the Comparison tab for details.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Results & Charts */}
              <div className="lg:col-span-8 space-y-8">
                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 border-l-4 border-l-blue-500 bg-white dark:bg-blue-950/20">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly EMI</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{formatCurrency(loanResult.emi)}</h3>
                  </Card>
                  <Card className="p-6 border-l-4 border-l-red-500 bg-white dark:bg-red-950/20">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Interest</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{formatCurrency(loanResult.totalInterest)}</h3>
                  </Card>
                  <Card className="p-6 border-l-4 border-l-emerald-500 bg-white dark:bg-emerald-950/20">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Payment</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{formatCurrency(loanResult.totalPayment)}</h3>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <PieChartIcon size={18} className="text-blue-600" />
                      Breakup of Total Payment
                    </h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <BarChart3 size={18} className="text-blue-600" />
                      Principal vs Interest Trend
                    </h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={schedule.filter((_, i) => i % (schedule.length > 24 ? 12 : 1) === 0)}>
                          <defs>
                            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                          <YAxis tickFormatter={(value) => `₹${value/1000}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Area type="monotone" dataKey="principal" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrincipal)" name="Principal" />
                          <Area type="monotone" dataKey="interest" stroke="#ef4444" fill="transparent" name="Interest" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                {/* Amortization Table */}
                <Card className="overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TableIcon size={18} className="text-blue-600" />
                      Amortization Schedule
                    </h3>
                    <button 
                      onClick={() => exportToExcel(schedule, `Amortization_${borrowerName}`)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <Download size={16} />
                      Excel
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Month</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">EMI</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Principal</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Interest</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {schedule.slice(0, 12).map((row) => (
                          <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium">{row.month}</td>
                            <td className="px-6 py-4 text-sm">{formatCurrency(row.emi)}</td>
                            <td className="px-6 py-4 text-sm text-blue-600 font-medium">{formatCurrency(row.principal)}</td>
                            <td className="px-6 py-4 text-sm text-red-500">{formatCurrency(row.interest)}</td>
                            <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {schedule.length > 12 && (
                      <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 italic">
                        Showing first 12 months. Download Excel for full schedule.
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'investment' && (
            <motion.div 
              key="investment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* FD Calculator */}
              <Card className="p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <PiggyBank size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Fixed Deposit (FD)</h2>
                    <p className="text-sm text-slate-500">Lump sum investment growth</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Deposit Amount (₹)">
                    <input 
                      type="number" 
                      value={fdInputs.amount} 
                      onChange={(e) => setFdInputs({ ...fdInputs, amount: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </InputGroup>
                  <InputGroup label="Interest Rate (%)">
                    <input 
                      type="number" 
                      step="0.1"
                      value={fdInputs.rate} 
                      onChange={(e) => setFdInputs({ ...fdInputs, rate: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </InputGroup>
                  <InputGroup label="Tenure (Years)">
                    <input 
                      type="number" 
                      value={fdInputs.tenure} 
                      onChange={(e) => setFdInputs({ ...fdInputs, tenure: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </InputGroup>
                  <InputGroup label="Compounding">
                    <select 
                      value={fdInputs.frequency}
                      onChange={(e) => setFdInputs({ ...fdInputs, frequency: e.target.value as CompoundingFrequency })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half-yearly">Half-Yearly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </InputGroup>
                </div>

                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Maturity Amount</p>
                    <h4 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(fdResult.maturityAmount)}</h4>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Interest Earned</p>
                    <h4 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(fdResult.interestEarned)}</h4>
                  </div>
                </div>
              </Card>

              {/* RD Calculator */}
              <Card className="p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Recurring Deposit (RD)</h2>
                    <p className="text-sm text-slate-500">Monthly savings growth</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Monthly Deposit (₹)">
                    <input 
                      type="number" 
                      value={rdInputs.monthly} 
                      onChange={(e) => setRdInputs({ ...rdInputs, monthly: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </InputGroup>
                  <InputGroup label="Interest Rate (%)">
                    <input 
                      type="number" 
                      step="0.1"
                      value={rdInputs.rate} 
                      onChange={(e) => setRdInputs({ ...rdInputs, rate: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </InputGroup>
                  <InputGroup label="Tenure (Months)">
                    <input 
                      type="number" 
                      value={rdInputs.tenure} 
                      onChange={(e) => setRdInputs({ ...rdInputs, tenure: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </InputGroup>
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Maturity Value</p>
                    <h4 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(rdResult.maturityValue)}</h4>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Interest Earned</p>
                    <h4 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(rdResult.interestEarned)}</h4>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'affordability' && (
            <motion.div 
              key="affordability"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <Card className="p-8 space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">EMI Affordability Calculator</h2>
                  <p className="text-slate-500">Check if your current loan EMI fits your budget</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputGroup label="Monthly Salary (₹)">
                    <input 
                      type="number" 
                      value={salary} 
                      onChange={(e) => setSalary(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </InputGroup>
                  <InputGroup label="Monthly Expenses (₹)">
                    <input 
                      type="number" 
                      value={expenses} 
                      onChange={(e) => setExpenses(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </InputGroup>
                </div>

                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl",
                    isAffordable ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-500 shadow-red-500/20"
                  )}>
                    {isAffordable ? <TrendingUp size={40} /> : <Info size={40} />}
                  </div>
                  
                  <div>
                    <h3 className={cn("text-xl font-bold", isAffordable ? "text-emerald-600" : "text-red-600")}>
                      {isAffordable ? "Great! This loan is affordable." : "Warning: This loan might be risky."}
                    </h3>
                    <p className="text-slate-500 mt-2 max-w-md">
                      Your current EMI is <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(loanResult.emi)}</span>. 
                      Based on your disposable income, we recommend an EMI below <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(maxEMI)}</span>.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'comparison' && (
            <motion.div 
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Investment Planning Comparison */}
              <Card className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Investment vs Loan Comparison</h2>
                    <p className="text-sm text-slate-500">Wealth impact of choosing Investment over Loan EMI</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Loan Cost</p>
                    <h4 className="text-xl font-bold text-red-500">{formatCurrency(loanResult.totalInterest)}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Interest paid to bank</p>
                  </div>
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">FD Return (Same Amt)</p>
                    <h4 className="text-xl font-bold text-emerald-600">{formatCurrency(fdResult.interestEarned)}</h4>
                    <p className="text-[10px] text-emerald-500 mt-1">Potential wealth gain</p>
                  </div>
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Opportunity Cost</p>
                    <h4 className="text-xl font-bold text-blue-600">{formatCurrency(fdResult.interestEarned + loanResult.totalInterest)}</h4>
                    <p className="text-[10px] text-blue-500 mt-1">Total wealth difference</p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                   <p className="text-sm text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                     <Info size={16} />
                     <strong>Best Decision:</strong> {loanInputs.rate > fdInputs.rate ? "Prioritize Loan Repayment" : "Invest in FD/RD instead of Prepayment"}
                   </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ArrowRightLeft className="text-blue-600" />
                    Flat vs Reducing Rate Comparison
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="px-8 py-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Factor</th>
                        <th className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-slate-100">Flat ROI</th>
                        <th className="px-8 py-6 text-sm font-bold text-blue-600">Reducing ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="px-8 py-6 font-medium">Monthly EMI</td>
                        <td className="px-8 py-6">{formatCurrency(flatLoanResult.emi)}</td>
                        <td className="px-8 py-6 font-bold text-blue-600">{formatCurrency(loanResult.emi)}</td>
                      </tr>
                      <tr>
                        <td className="px-8 py-6 font-medium">Total Interest</td>
                        <td className="px-8 py-6">{formatCurrency(flatLoanResult.totalInterest)}</td>
                        <td className="px-8 py-6 font-bold text-blue-600">{formatCurrency(loanResult.totalInterest)}</td>
                      </tr>
                      <tr>
                        <td className="px-8 py-6 font-medium">Total Payment</td>
                        <td className="px-8 py-6">{formatCurrency(flatLoanResult.totalPayment)}</td>
                        <td className="px-8 py-6 font-bold text-blue-600">{formatCurrency(loanResult.totalPayment)}</td>
                      </tr>
                      <tr>
                        <td className="px-8 py-6 font-medium">Effective APR</td>
                        <td className="px-8 py-6">{flatLoanResult.apr.toFixed(2)}%</td>
                        <td className="px-8 py-6 font-bold text-blue-600">{loanResult.apr.toFixed(2)}%</td>
                      </tr>
                      <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                        <td className="px-8 py-6 font-bold">Total Savings</td>
                        <td className="px-8 py-6 text-slate-400">-</td>
                        <td className="px-8 py-6 font-bold text-emerald-600">
                          {formatCurrency(flatLoanResult.totalPayment - loanResult.totalPayment)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Info size={18} className="text-blue-600" />
                    What is Flat Interest?
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Interest is calculated on the full principal amount throughout the loan tenure. The principal doesn't decrease for interest calculation even as you pay it back. This makes it significantly more expensive.
                  </p>
                </Card>
                <Card className="p-8 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-600" />
                    What is Reducing Balance?
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Interest is calculated only on the outstanding principal balance. As you pay your EMIs, the principal reduces, and so does the interest component. This is the standard for most bank loans today.
                  </p>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500">
          © 2026 FinPlan Pro. All financial calculations are indicative. Please consult with your bank for exact figures.
        </p>
      </footer>
    </div>
  );
}
