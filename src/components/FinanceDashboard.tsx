import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Tag, ArrowLeft, Filter, Search, Menu, X, Eye, EyeOff, Trash2, HelpCircle, MessageCircle, Command, FileText } from 'lucide-react';

// Tipos de dados
interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  createdAt: string;
  userId: string;
}

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categorySummary: Record<string, number>;
  transactionCount: number;
}

type ViewMode = 'dashboard' | 'expenses' | 'income' | 'transactions';

// Cores para os gráficos (tema escuro)
const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#FB7185'];

// Função utilitária para pegar o userId da URL
const getUserIdFromUrl = (): string => {
  const params = new URLSearchParams(window.location.search);
  return params.get('userId') || 'default_user';
};

const FinanceDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userId = getUserIdFromUrl();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Simulando dados para demonstração
      const mockTransactions = [
        { _id: '1', type: 'expense', amount: 50, description: 'Mercado', category: 'Alimentação', createdAt: new Date().toISOString(), userId: 'user1' },
        { _id: '2', type: 'income', amount: 1000, description: 'Salário', category: 'Trabalho', createdAt: new Date().toISOString(), userId: 'user1' },
      ];
      const mockSummary = {
        totalIncome: 1000,
        totalExpenses: 50,
        balance: 950,
        categorySummary: { 'Alimentação': 50, 'Trabalho': 1000 },
        transactionCount: 2
      };
      
      setTransactions(mockTransactions as Transaction[]);
      setSummary(mockSummary);
    } catch (error) {
      console.error('Error loading data:', error);
      setTransactions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemoveTransaction = async (transactionId: string) => {
    const isConfirmed = window.confirm('Tem certeza que deseja apagar esta transação?');
    if (isConfirmed) {
      try {
        // await deleteTransaction(userId, transactionId);
        loadData();
        alert('Transação excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        alert('Erro ao excluir transação.');
      }
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const prepareCategoryData = (categorySummary: Record<string, number>) => {
    return Object.entries(categorySummary).map(([category, amount]) => ({ name: category, value: amount }));
  };

  const getFilteredTransactions = (): Transaction[] => {
    let filtered = transactions;

    if (currentView === 'expenses') {
      filtered = filtered.filter(t => t.type === 'expense');
    } else if (currentView === 'income') {
      filtered = filtered.filter(t => t.type === 'income');
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getCategories = (): string[] => {
    const categories = [...new Set(transactions.map(t => t.category))];
    return categories.sort();
  };

  const renderMobileHeader = () => (
    <div className="flex items-center justify-between p-4 bg-gray-900 md:hidden">
      {currentView !== 'dashboard' && (
        <button onClick={() => setCurrentView('dashboard')} className="p-1 text-gray-400 hover:text-white" >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <h1 className="text-xl font-bold text-white flex-1 text-center">
        {currentView === 'dashboard' && 'Dashboard'}
        {currentView === 'expenses' && 'Despesas'}
        {currentView === 'income' && 'Receitas'}
        {currentView === 'transactions' && 'Transações'}
      </h1>
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 text-gray-400 hover:text-white md:hidden" >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </div>
  );

  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } md:relative md:translate-x-0`}>
      <div className="flex items-center justify-center p-4">
        <DollarSign className="h-8 w-8 text-white" />
        <span className="ml-3 text-2xl font-bold text-white">FinanceApp</span>
      </div>
      <div className="text-sm text-gray-400 text-center mb-4">Controle Financeiro</div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => {
            setCurrentView('dashboard');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
            currentView === 'dashboard'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <DollarSign className="h-5 w-5" />
          <span>Dashboard</span>
        </button>
        
        <button
          onClick={() => {
            setCurrentView('expenses');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
            currentView === 'expenses'
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <TrendingDown className="h-5 w-5" />
          <span>Despesas</span>
        </button>
        
        <button
          onClick={() => {
            setCurrentView('income');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
            currentView === 'income'
              ? 'bg-green-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <TrendingUp className="h-5 w-5" />
          <span>Receitas</span>
        </button>
        
        <button
          onClick={() => {
            setCurrentView('transactions');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
            currentView === 'transactions'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span>Todas Transações</span>
        </button>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="bg-blue-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-100 mb-2 flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </h3>
          <p className="text-xs text-blue-200">
            Envie "ajuda" para ver os comandos.
          </p>
        </div>
      </div>
    </div>
  );

  const renderSummaryCards = () => {
    if (!summary) return null;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div 
          className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-gray-750 transition-all duration-200 hover:scale-105"
          onClick={() => setCurrentView('dashboard')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400">Saldo</p>
              <div className="flex items-center space-x-2">
                <p className={`text-lg lg:text-2xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {showBalance ? formatCurrency(summary.balance) : '••••'}
                </p>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setShowBalance(!showBalance);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${summary.balance >= 0 ? 'bg-green-900' : 'bg-red-900'}`}>
              <DollarSign className={`h-6 w-6 lg:h-8 lg:w-8 ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </div>
        </div>
      
        <div 
          className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-gray-750 transition-all duration-200 hover:scale-105"
          onClick={() => setCurrentView('income')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Receitas</p>
              <p className="text-lg lg:text-2xl font-bold text-green-400">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            <div className="p-2 bg-green-900 rounded-lg">
              <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-green-400" />
            </div>
          </div>
        </div>
      
        <div 
          className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-gray-750 transition-all duration-200 hover:scale-105"
          onClick={() => setCurrentView('expenses')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Despesas</p>
              <p className="text-lg lg:text-2xl font-bold text-red-400">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
            <div className="p-2 bg-red-900 rounded-lg">
              <TrendingDown className="h-6 w-6 lg:h-8 lg:w-8 text-red-400" />
            </div>
          </div>
        </div>
      
        <div 
          className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-gray-750 transition-all duration-200 hover:scale-105"
          onClick={() => setCurrentView('transactions')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Transações</p>
              <p className="text-lg lg:text-2xl font-bold text-blue-400">
                {summary.transactionCount}
              </p>
            </div>
            <div className="p-2 bg-blue-900 rounded-lg">
              <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCharts = () => {
    if (!summary || Object.keys(summary.categorySummary).length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
            Gastos por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={prepareCategoryData(summary.categorySummary)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string, percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {prepareCategoryData(summary.categorySummary).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)} 
                contentStyle={{ 
                  backgroundColor: '#374151', 
                  border: '1px solid #4B5563',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
            Distribuição de Gastos
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={prepareCategoryData(summary.categorySummary)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#4B5563' }}
              />
              <YAxis 
                tickFormatter={(value: number) => `R$ ${value}`} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#4B5563' }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: '#374151', 
                  border: '1px solid #4B5563',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderFilters = () => {
    if (currentView === 'dashboard') return null;

    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={selectedCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas categorias</option>
                {getCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionsList = () => {
    const filteredTransactions = getFilteredTransactions();

    return (
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-200">
        <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <div className="w-2 h-6 bg-purple-500 rounded-full mr-3"></div>
            {currentView === 'expenses' && 'Suas Despesas'}
            {currentView === 'income' && 'Suas Receitas'}
            {(currentView === 'transactions' || currentView === 'dashboard') && 'Últimas Transações'}
          </h3>
          {filteredTransactions.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {filteredTransactions.length} transaç{filteredTransactions.length === 1 ? 'ão' : 'ões'} encontrada{filteredTransactions.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <div className="divide-y divide-gray-700">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium mb-2">Nenhuma transação encontrada</p>
              <p className="text-sm">
                {searchTerm && 'Tente ajustar os filtros de busca'}
                {!searchTerm && 'Suas transações aparecerão aqui'}
              </p>
            </div>
          ) : (
            filteredTransactions.slice(0, currentView === 'dashboard' ? 5 : undefined).map((transaction) => (
              <div key={transaction._id} className="p-4 hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      transaction.type === 'income'
                        ? 'bg-green-900 text-green-400 border border-green-700'
                        : 'bg-red-900 text-red-400 border border-red-700'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-6 w-6" />
                      ) : (
                        <TrendingDown className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-xs text-gray-400 truncate">
                            {transaction.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">ID: {transaction._id}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4 flex items-center space-x-4">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <button
                        onClick={() => handleRemoveTransaction(transaction._id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-900 p-2 rounded-lg transition-all duration-200"
                        title="Apagar Transação"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {currentView === 'dashboard' && filteredTransactions.length > 5 && (
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-750">
            <button
              onClick={() => setCurrentView('transactions')}
              className="w-full text-blue-400 hover:text-blue-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ver todas as transações ({transactions.length})
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderWhatsAppCommands = () => (
    <div className="mt-8 bg-gradient-to-br from-green-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-green-800">
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-3 mb-3">
          <div className="bg-green-600 p-3 rounded-xl">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Controle via WhatsApp</h2>
        </div>
        <p className="text-green-200 max-w-2xl mx-auto">
          Gerencie suas finanças de forma simples e rápida através do WhatsApp. 
          Envie mensagens naturais e tenha controle total dos seus gastos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Registrar Despesas */}
        <div className="bg-gradient-to-br from-red-900/50 to-gray-800 rounded-xl p-6 border border-red-700/30 hover:border-red-600/50 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-red-600 p-2 rounded-lg">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-red-300">Registrar Despesas</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <code className="text-red-200 text-sm">"50 no mercado"</code>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <code className="text-red-200 text-sm">"25.50 lanche"</code>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <code className="text-red-200 text-sm">"100 conta de luz"</code>
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-3">
            💡 Formato: valor + descrição
          </p>
        </div>

        {/* Registrar Receitas */}
        <div className="bg-gradient-to-br from-green-900/50 to-gray-800 rounded-xl p-6 border border-green-700/30 hover:border-green-600/50 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-600 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-green-300">Registrar Receitas</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <code className="text-green-200 text-sm">"recebi 1000 salário"</code>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <code className="text-green-200 text-sm">"ganhei 500 freelance"</code>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <code className="text-green-200 text-sm">"entrou 200 venda"</code>
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-3">
            💡 Use: recebi, ganhei ou entrou
          </p>
        </div>

        {/* Comandos Especiais */}
        <div className="bg-gradient-to-br from-blue-900/50 to-gray-800 rounded-xl p-6 border border-blue-700/30 hover:border-blue-600/50 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Command className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-blue-300">Comandos Especiais</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <code className="text-blue-200 text-sm">"relatório de hoje"</code>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <code className="text-blue-200 text-sm">"dashboard"</code>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <code className="text-blue-200 text-sm">"apagar [ID]"</code>
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-3">
            💡 Use "ajuda" para ver todos os comandos
          </p>
        </div>
      </div>

      {/* Seção de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-r from-purple-900/30 to-gray-800/50 rounded-xl p-5 border border-purple-700/20">
          <div className="flex items-center space-x-3 mb-3">
            <FileText className="h-6 w-6 text-purple-400" />
            <h4 className="text-lg font-semibold text-purple-200">Relatórios Disponíveis</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-900/40 rounded-lg p-3">
              <span className="text-purple-300 font-medium">Hoje:</span>
              <p className="text-gray-300">"relatório de hoje"</p>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3">
              <span className="text-purple-300 font-medium">Semana:</span>
              <p className="text-gray-300">"relatório da semana"</p>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3">
              <span className="text-purple-300 font-medium">Mês:</span>
              <p className="text-gray-300">"relatório do mês"</p>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3">
              <span className="text-purple-300 font-medium">Geral:</span>
              <p className="text-gray-300">"relatório geral"</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-900/30 to-gray-800/50 rounded-xl p-5 border border-amber-700/20">
          <div className="flex items-center space-x-3 mb-3">
            <HelpCircle className="h-6 w-6 text-amber-400" />
            <h4 className="text-lg font-semibold text-amber-200">Dicas Úteis</h4>
          </div>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
              <p>Use valores com vírgula ou ponto: "25,50" ou "25.50"</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
              <p>Seja específico na descrição para melhor categorização</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
              <p>Use "dashboard" para receber o link de acesso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Ajuda */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-full font-medium shadow-lg">
          <MessageCircle className="h-5 w-5" />
          <span>Envie "ajuda" no WhatsApp para ver todos os comandos</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!userId) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
                <div className="bg-red-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <DollarSign className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Acesso Negado</h1>
                <p className="text-gray-400 mb-6">Para acessar seu dashboard, você precisa solicitar o link pelo WhatsApp.</p>
                
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-6 border border-blue-700">
                    <h3 className="text-lg font-semibold text-blue-100 mb-3 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Como obter o link?
                    </h3>
                    <p className="text-sm text-blue-200">
                        Envie a mensagem <strong>"dashboard"</strong> para o seu número do Twilio no WhatsApp.
                        Você receberá um link exclusivo e seguro para acessar seus dados.
                    </p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar */}
      {renderSidebar()}
      
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden">
          {renderMobileHeader()}
        </div>
        
        <div className="p-4 md:p-6 lg:p-8">
          {/* Desktop header */}
          <div className="hidden md:block mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-1 h-12 bg-blue-500 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {currentView === 'dashboard' && 'Dashboard Financeiro'}
                  {currentView === 'expenses' && 'Controle de Despesas'}
                  {currentView === 'income' && 'Controle de Receitas'}
                  {currentView === 'transactions' && 'Todas as Transações'}
                </h1>
                <p className="text-gray-400 mt-1">
                  {currentView === 'dashboard' && 'Visão geral das suas finanças'}
                  {currentView === 'expenses' && 'Acompanhe seus gastos detalhadamente'}
                  {currentView === 'income' && 'Gerencie suas fontes de renda'}
                  {currentView === 'transactions' && 'Histórico completo de movimentações'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Summary Cards */}
          {renderSummaryCards()}
          
          {/* Charts - only show on dashboard */}
          {currentView === 'dashboard' && renderCharts()}
          
          {/* Filters */}
          {renderFilters()}
          
          {/* Transactions List */}
          {renderTransactionsList()}
          
          {/* WhatsApp Integration */}
          {renderWhatsAppCommands()}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;