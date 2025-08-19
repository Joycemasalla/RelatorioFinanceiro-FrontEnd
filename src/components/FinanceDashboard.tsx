import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Tag, ArrowLeft, Filter, Search, Menu, X, Eye, EyeOff, Trash2 } from 'lucide-react';
import { fetchTransactions, deleteTransaction } from '../api/transactionsApi';

// Tipos de dados
interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  createdAt: string;
  userId: string; // Adicionado userId
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
  return params.get('userId') || 'default_user'; // Retorna 'default_user' se não houver ID
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
      const { transactions, summary } = await fetchTransactions(userId);
      setTransactions(transactions);
      setSummary(summary);
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
        await deleteTransaction(userId, transactionId);
        loadData(); // Recarrega os dados após a exclusão
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
          <h3 className="text-sm font-semibold text-blue-100 mb-2">WhatsApp</h3>
          <p className="text-xs text-blue-200">
            Envie "gastei 50 no mercado" para registrar gastos!
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
          className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors"
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
            <DollarSign className={`h-6 w-6 lg:h-8 lg:w-8 ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
          </div>
        </div>
      
        <div 
          className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors"
          onClick={() => setCurrentView('income')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Receitas</p>
              <p className="text-lg lg:text-2xl font-bold text-green-400">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-green-400" />
          </div>
        </div>
      
        <div 
          className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors"
          onClick={() => setCurrentView('expenses')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Despesas</p>
              <p className="text-lg lg:text-2xl font-bold text-red-400">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
            <TrendingDown className="h-6 w-6 lg:h-8 lg:w-8 text-red-400" />
          </div>
        </div>
      
        <div 
          className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors"
          onClick={() => setCurrentView('transactions')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Transações</p>
              <p className="text-lg lg:text-2xl font-bold text-blue-400">
                {summary.transactionCount}
              </p>
            </div>
            <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-blue-400" />
          </div>
        </div>
      </div>
    );
  };

  const renderCharts = () => {
    if (!summary || Object.keys(summary.categorySummary).length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Gastos por Categoria</h3>
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
      
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Gastos</h3>
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
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
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
            <div className="p-6 text-center text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
              <p className="text-sm mt-2">
                {searchTerm && 'Tente ajustar os filtros de busca'}
                {!searchTerm && 'Suas transações aparecerão aqui'}
              </p>
            </div>
          ) : (
            filteredTransactions.slice(0, currentView === 'dashboard' ? 5 : undefined).map((transaction) => (
              <div key={transaction._id} className="p-4 hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income'
                        ? 'bg-green-900 text-green-400'
                        : 'bg-red-900 text-red-400'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Tag className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-400 truncate">
                          {transaction.category}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">ID: {transaction._id}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4 flex items-center space-x-4">
                    <p className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <button
                        onClick={() => handleRemoveTransaction(transaction._id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
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
          <div className="px-6 py-4 border-t border-gray-700">
            <button
              onClick={() => setCurrentView('transactions')}
              className="w-full text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Ver todas as transações ({transactions.length})
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Carregando dashboard...</p>
      </div>
    );
  }
  
  if (!userId) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
            <DollarSign className="h-16 w-16 text-white mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
            <p className="text-gray-400 mb-4">Para acessar seu dashboard, você precisa solicitar o link pelo WhatsApp.</p>
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 max-w-sm mx-auto">
                <h3 className="text-lg font-semibold text-blue-100 mb-3">Como obter o link?</h3>
                <p className="text-sm text-blue-200">
                    Envie a mensagem **"dashboard"** para o seu número do Twilio no WhatsApp.
                    Você receberá um link exclusivo e seguro para acessar seus dados.
                </p>
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
            <h1 className="text-3xl font-bold text-white">
              {currentView === 'dashboard' && 'Dashboard Financeiro'}
              {currentView === 'expenses' && 'Controle de Despesas'}
              {currentView === 'income' && 'Controle de Receitas'}
              {currentView === 'transactions' && 'Todas as Transações'}
            </h1>
            <p className="text-gray-400 mt-2">
              {currentView === 'dashboard' && 'Visão geral das suas finanças'}
              {currentView === 'expenses' && 'Acompanhe seus gastos detalhadamente'}
              {currentView === 'income' && 'Gerencie suas fontes de renda'}
              {currentView === 'transactions' && 'Histórico completo de movimentações'}
            </p>
          </div>
          
          {/* Summary Cards */}
          {renderSummaryCards()}
          
          {/* Charts - only show on dashboard */}
          {currentView === 'dashboard' && renderCharts()}
          
          {/* Filters */}
          {renderFilters()}
          
          {/* Transactions List */}
          {renderTransactionsList()}
          
          {/* WhatsApp Integration Info */}
          {currentView === 'dashboard' && (
            <div className="mt-8 bg-gradient-to-r from-green-900 to-blue-900 border border-green-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                📱 Integração com o WhatsApp
              </h3>
              <div className="space-y-3 text-sm text-green-100">
                <div>
                  <p className="font-medium text-white mb-2">Para registrar gastos:</p>
                  <div className="space-y-1 ml-4">
                    <p>• "gastei 50 no mercado"</p>
                    <p>• "despesa 30 combustível"</p>
                    <p>• "gasto 25 lanche"</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-white mb-2">Para registrar receitas:</p>
                  <div className="space-y-1 ml-4">
                    <p>• "recebi 1000 de salário"</p>
                    <p>• "receita 500 freelance"</p>
                    <p>• "ganho 800 trabalho"</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-white mb-2">Outros comandos:</p>
                  <div className="space-y-1 ml-4">
                    <p>• "relatório de hoje" ou "relatório do mês"</p>
                    <p>• "dashboard" para receber o link</p>
                    <p>• "apagar [ID da transação]" para excluir</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;