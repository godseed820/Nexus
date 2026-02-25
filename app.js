// ============================================
// NEXUSFI - DASHBOARD APPLICATION
// ============================================

// Get user-specific initial balance
const currentUser = getCurrentUser();
const INITIAL_BALANCE = currentUser?.portfolio?.balance || 500.00;

// Application State
const state = {
    balance: currentUser?.portfolio?.balance || 500.00,
    portfolioValue: 0,
    profit: 0,
    activePositions: 0,
    selectedInvestAsset: null,
    investments: currentUser?.portfolio?.investments || [],
    transactions: currentUser?.portfolio?.transactions || [],
    cryptoPrices: {
        BTC: { price: 6622.00, change: 2.4, icon: 'fab fa-bitcoin', color: 'text-orange-500' },
        ETH: { price: 1973.80, change: -1.2, icon: 'fab fa-ethereum', color: 'text-purple-500' },
        SOL: { price: 84.671, change: 5.7, icon: 'fas fa-sun', color: 'text-teal-400' },
        ADA: { price: 0.28472, change: -0.5, icon: 'fas fa-circle', color: 'text-blue-500' },
        DOT: { price: 7.25, change: 3.2, icon: 'fas fa-dot-circle', color: 'text-pink-500' },
        LINK: { price: 9.0542, change: 1.8, icon: 'fas fa-link', color: 'text-blue-400' }
    }
};

// Chart instances
let portfolioChart, allocationChart;

// Initialize user info in UI
function initUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const displayName = user.firstName || 'Trader';
        document.getElementById('welcome-name').textContent = displayName;
        document.getElementById('user-name').textContent = displayName;
        document.getElementById('dropdown-name').textContent = user.firstName + ' ' + user.lastName;
        document.getElementById('dropdown-email').textContent = user.email;
    }
}

// Toggle user dropdown
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('user-menu');
    const dropdown = document.getElementById('user-dropdown');
    if (userMenu && !userMenu.contains(event.target)) {
        dropdown?.classList.add('hidden');
    }
});

// Save user data to localStorage
function saveUserData() {
    const user = getCurrentUser();
    if (user) {
        user.portfolio = {
            balance: state.balance,
            investments: state.investments,
            transactions: state.transactions
        };
        saveCurrentUser(user);
        
        // Update in users array too
        const users = getUsers();
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index] = user;
            saveUsers(users);
        }
    }
}

// Initialize Charts
function initCharts() {
    const ctx1 = document.getElementById('portfolioChart').getContext('2d');
    portfolioChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
            datasets: [{
                label: 'Portfolio Value',
                data: [9800, 9950, 10200, 10100, 10400, 10600, 10850],
                borderColor: '#00D4FF',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#6B7280', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { 
                        color: '#6B7280', 
                        font: { size: 10 },
                        callback: function(value) { return '$' + value.toLocaleString(); }
                    }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });

    const ctx2 = document.getElementById('allocationChart').getContext('2d');
    allocationChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#00D4FF', '#7B61FF', '#10B981', '#F59E0B', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { display: false } }
        }
    });
}

// Update UI
function updateUI() {
    document.getElementById('total-balance').textContent = '$' + state.balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('portfolio-value').textContent = '$' + state.portfolioValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total-profit').textContent = '$' + state.profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('active-positions').textContent = state.activePositions;
    document.getElementById('withdraw-available').textContent = '$' + state.balance.toLocaleString('en-US', {minimumFractionDigits: 2});
    
    renderInvestmentCards();
    renderTransactions();
    renderAllocation();
    renderMarkets();
    renderPortfolio();
    renderFullHistory();
    
    // Save to localStorage
    saveUserData();
}

function renderInvestmentCards() {
    const container = document.getElementById('investment-cards');
    const assets = Object.entries(state.cryptoPrices).slice(0, 3);
    
    container.innerHTML = assets.map(([symbol, data]) => `
        <div class="glass rounded-2xl p-6 glow-hover transition-all duration-300 group cursor-pointer" onclick="openInvestModal('${symbol}')">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center crypto-icon">
                        <i class="${data.icon} ${data.color} text-2xl"></i>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-lg">${symbol}</h4>
                        <p class="text-xs text-gray-400">Crypto</p>
                    </div>
                </div>
                <span class="text-xs ${data.change >= 0 ? 'text-success' : 'text-danger'} bg-${data.change >= 0 ? 'success' : 'danger'}/10 px-2 py-1 rounded-full">
                    ${data.change >= 0 ? '+' : ''}${data.change}%
                </span>
            </div>
            <div class="mb-4">
                <p class="text-2xl font-display font-bold text-white">$${data.price.toLocaleString()}</p>
                <p class="text-xs text-gray-500 mt-1">Vol: $2.4B</p>
            </div>
            <button onclick="event.stopPropagation(); openInvestModal('${symbol}')" class="w-full py-2 rounded-lg bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 transition-all text-sm font-semibold">
                Invest Now
            </button>
        </div>
    `).join('');
}

function renderTransactions() {
    const tbody = document.getElementById('transactions-table');
    const recentTx = state.transactions.slice(0, 5);
    
    if (recentTx.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-gray-500">No transactions yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentTx.map(tx => `
        <tr class="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
            <td class="py-4 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                    <i class="${state.cryptoPrices[tx.asset]?.icon || 'fas fa-coins'} text-gray-400"></i>
                </div>
                <span class="font-medium">${tx.asset}</span>
            </td>
            <td class="py-4">
                <span class="px-2 py-1 rounded text-xs ${tx.type === 'Deposit' || tx.type === 'Bonus' ? 'bg-success/20 text-success' : tx.type === 'Investment' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}">
                    ${tx.type}
                </span>
            </td>
            <td class="py-4 font-medium">$${tx.amount.toLocaleString()}</td>
            <td class="py-4">
                <span class="flex items-center gap-1 text-xs text-success">
                    <i class="fas fa-check-circle"></i> Completed
                </span>
            </td>
            <td class="py-4 text-gray-400 text-xs">${tx.time}</td>
        </tr>
    `).join('');
}

function renderAllocation() {
    const legend = document.getElementById('allocation-legend');
    const investments = state.investments;
    
    if (investments.length === 0) {
        legend.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No investments yet</p>';
        allocationChart.data.labels = [];
        allocationChart.data.datasets[0].data = [];
        allocationChart.update();
        return;
    }

    const total = investments.reduce((sum, inv) => sum + inv.value, 0);
    const data = investments.map(inv => ({
        symbol: inv.asset,
        value: inv.value,
        percentage: ((inv.value / total) * 100).toFixed(1)
    }));

    allocationChart.data.labels = data.map(d => d.symbol);
    allocationChart.data.datasets[0].data = data.map(d => d.value);
    allocationChart.update();

    const colors = ['#00D4FF', '#7B61FF', '#10B981', '#F59E0B', '#EF4444'];
    
    legend.innerHTML = data.map((d, i) => `
        <div class="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full" style="background-color: ${colors[i % colors.length]}"></div>
                <span class="font-medium text-sm">${d.symbol}</span>
            </div>
            <div class="text-right">
                <p class="text-sm font-semibold">$${d.value.toLocaleString()}</p>
                <p class="text-xs text-gray-400">${d.percentage}%</p>
            </div>
        </div>
    `).join('');
}

function renderMarkets() {
    const tbody = document.getElementById('markets-table');
    const assets = Object.entries(state.cryptoPrices);
    
    tbody.innerHTML = assets.map(([symbol, data]) => `
        <tr class="hover:bg-gray-800/30 transition-colors">
            <td class="p-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                    <i class="${data.icon} ${data.color} text-xl"></i>
                </div>
                <div>
                    <p class="font-semibold">${symbol}</p>
                    <p class="text-xs text-gray-400">Crypto</p>
                </div>
            </td>
            <td class="p-4 font-semibold">$${data.price.toLocaleString()}</td>
            <td class="p-4">
                <span class="${data.change >= 0 ? 'text-success' : 'text-danger'}">
                    ${data.change >= 0 ? '+' : ''}${data.change}%
                </span>
            </td>
            <td class="p-4 text-gray-400">$${(Math.random() * 100 + 10).toFixed(1)}B</td>
            <td class="p-4">
                <button onclick="openInvestModal('${symbol}')" class="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-sm font-medium">
                    Trade
                </button>
            </td>
        </tr>
    `).join('');
}

function renderPortfolio() {
    const container = document.getElementById('portfolio-holdings');
    
    if (state.investments.length === 0) {
        container.innerHTML = `
            <div class="glass rounded-2xl p-12 text-center">
                <div class="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-wallet text-gray-400 text-2xl"></i>
                </div>
                <h3 class="font-display font-semibold text-lg mb-2">No investments yet</h3>
                <p class="text-gray-400 text-sm mb-4">Start building your portfolio today</p>
                <button onclick="showMarkets()" class="px-6 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-all">
                    Browse Markets
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = state.investments.map(inv => `
        <div class="glass rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <i class="${state.cryptoPrices[inv.asset]?.icon || 'fas fa-coins'} ${state.cryptoPrices[inv.asset]?.color || 'text-gray-400'} text-xl"></i>
                </div>
                <div>
                    <h4 class="font-display font-bold text-lg">${inv.asset}</h4>
                    <p class="text-xs text-gray-400">${inv.amount.toFixed(8)} ${inv.asset}</p>
                </div>
            </div>
            <div class="flex gap-8 text-center">
                <div>
                    <p class="text-xs text-gray-400 mb-1">Invested</p>
                    <p class="font-semibold">$${inv.invested.toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-400 mb-1">Current Value</p>
                    <p class="font-semibold text-primary">$${inv.value.toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-400 mb-1">P/L</p>
                    <p class="font-semibold ${inv.profit >= 0 ? 'text-success' : 'text-danger'}">
                        ${inv.profit >= 0 ? '+' : ''}$${inv.profit.toLocaleString()}
                    </p>
                </div>
            </div>
            <button onclick="sellInvestment('${inv.asset}')" class="px-4 py-2 rounded-lg border border-danger text-danger hover:bg-danger/10 transition-all text-sm">
                Sell
            </button>
        </div>
    `).join('');
}

function renderFullHistory() {
    const container = document.getElementById('full-history');
    
    if (state.transactions.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No transaction history</p>';
        return;
    }

    container.innerHTML = state.transactions.map(tx => `
        <div class="flex justify-between items-center p-4 rounded-lg bg-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full ${tx.type === 'Deposit' || tx.type === 'Bonus' ? 'bg-success/20 text-success' : tx.type === 'Investment' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'} flex items-center justify-center">
                    <i class="fas ${tx.type === 'Deposit' || tx.type === 'Bonus' ? 'fa-arrow-down' : tx.type === 'Investment' ? 'fa-chart-line' : 'fa-arrow-up'}"></i>
                </div>
                <div>
                    <p class="font-semibold">${tx.type} - ${tx.asset}</p>
                    <p class="text-xs text-gray-400">${tx.time}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-semibold ${tx.type === 'Withdrawal' ? 'text-danger' : 'text-white'}">
                    ${tx.type === 'Withdrawal' ? '-' : '+'}$${tx.amount.toLocaleString()}
                </p>
                <p class="text-xs text-success">Completed</p>
            </div>
        </div>
    `).join('');
}

// Navigation
function showDashboard() {
    hideAllViews();
    document.getElementById('dashboard-view').classList.remove('hidden');
}

function showMarkets() {
    hideAllViews();
    document.getElementById('markets-view').classList.remove('hidden');
}

function showPortfolio() {
    hideAllViews();
    document.getElementById('portfolio-view').classList.remove('hidden');
}

function showHistory() {
    hideAllViews();
    document.getElementById('history-view').classList.remove('hidden');
}

function hideAllViews() {
    ['dashboard-view', 'markets-view', 'portfolio-view', 'history-view'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
}

// User menu navigation
function showProfile() {
    showToast('Info', 'Profile page coming soon', 'success');
    toggleUserMenu();
}

function showSettings() {
    showToast('Info', 'Settings page coming soon', 'success');
    toggleUserMenu();
}

function showSecurity() {
    showToast('Info', 'Security settings coming soon', 'success');
    toggleUserMenu();
}

// Modals
function openDepositModal() {
    document.getElementById('deposit-modal').classList.remove('hidden');
}

function closeDepositModal() {
    document.getElementById('deposit-modal').classList.add('hidden');
}

function copyAddress() {
    const copyText = document.getElementById("wallet-address");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    
    const feedback = document.getElementById('copy-feedback');
    feedback.classList.remove('opacity-0');
    setTimeout(() => feedback.classList.add('opacity-0'), 2000);
}

function processDeposit() {
    showToast('Verification Pending', 'We are verifying your transaction on the blockchain.', 'success');
    closeDepositModal();
}

function openInvestModal(asset) {
    state.selectedInvestAsset = asset;
    const data = state.cryptoPrices[asset];
    document.getElementById('invest-asset-name').textContent = asset;
    document.getElementById('invest-price').textContent = '$' + data.price.toLocaleString();
    document.getElementById('invest-change').textContent = (data.change >= 0 ? '+' : '') + data.change + '%';
    document.getElementById('invest-change').className = data.change >= 0 ? 'text-success text-sm' : 'text-danger text-sm';
    document.getElementById('invest-available').textContent = '$' + state.balance.toLocaleString();
    document.getElementById('invest-amount').value = '';
    document.getElementById('invest-receive').textContent = '0.00000000';
    document.getElementById('invest-modal').classList.remove('hidden');
}

function closeInvestModal() {
    document.getElementById('invest-modal').classList.add('hidden');
}

function setInvestAmount(percentage) {
    const amount = (state.balance * percentage / 100).toFixed(2);
    document.getElementById('invest-amount').value = amount;
    updateInvestPreview();
}

function updateInvestPreview() {
    const amount = parseFloat(document.getElementById('invest-amount').value) || 0;
    const price = state.cryptoPrices[state.selectedInvestAsset].price;
    const receive = (amount / price).toFixed(8);
    document.getElementById('invest-receive').textContent = receive;
}

function processInvestment() {
    const amount = parseFloat(document.getElementById('invest-amount').value);
    if (!amount || amount <= 0) {
        showToast('Error', 'Please enter a valid amount', 'error');
        return;
    }
    if (amount > state.balance) {
        showToast('Error', 'Insufficient balance', 'error');
        return;
    }

    const price = state.cryptoPrices[state.selectedInvestAsset].price;
    const quantity = amount / price;
    
    state.balance -= amount;
    state.portfolioValue += amount;
    state.activePositions += 1;
    
    const existing = state.investments.find(inv => inv.asset === state.selectedInvestAsset);
    if (existing) {
        existing.amount += quantity;
        existing.invested += amount;
        existing.value = existing.amount * price;
    } else {
        state.investments.push({
            asset: state.selectedInvestAsset,
            amount: quantity,
            invested: amount,
            value: amount,
            profit: 0
        });
    }

    state.transactions.unshift({
        type: 'Investment',
        asset: state.selectedInvestAsset,
        amount: amount,
        time: new Date().toLocaleString()
    });

    showToast('Success', `Invested $${amount.toLocaleString()} in ${state.selectedInvestAsset}`, 'success');
    closeInvestModal();
    updateUI();
}

function openWithdrawModal() {
    document.getElementById('withdraw-modal').classList.remove('hidden');
}

function closeWithdrawModal() {
    document.getElementById('withdraw-modal').classList.add('hidden');
}

function processWithdrawal() {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const earnedBalance = state.balance - INITIAL_BALANCE;

    if (!amount || amount < 50) {
        showToast('Error', 'Minimum withdrawal is $50', 'error');
        return;
    }
    if (amount > state.balance) {
        showToast('Error', 'Insufficient balance', 'error');
        return;
    }
    if (amount > earnedBalance) {
        showToast('Restricted', 'You cannot withdraw the initial deposit bonus. Only profits can be withdrawn.', 'error');
        return;
    }

    state.balance -= amount;
    state.transactions.unshift({
        type: 'Withdrawal',
        asset: 'USD',
        amount: amount,
        time: new Date().toLocaleString()
    });

    showToast('Success', `Withdrawal of $${amount.toLocaleString()} processed`, 'success');
    closeWithdrawModal();
    updateUI();
}

function sellInvestment(asset) {
    const inv = state.investments.find(i => i.asset === asset);
    if (!inv) return;

    state.balance += inv.value;
    state.portfolioValue -= inv.value;
    state.profit += inv.profit;
    state.activePositions -= 1;
    
    state.transactions.unshift({
        type: 'Sale',
        asset: asset,
        amount: inv.value,
        time: new Date().toLocaleString()
    });

    state.investments = state.investments.filter(i => i.asset !== asset);
    showToast('Success', `Sold ${asset} for $${inv.value.toLocaleString()}`, 'success');
    updateUI();
}

function updateTimeframe(tf) {
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.classList.remove('bg-primary/20', 'text-primary');
        btn.classList.add('text-gray-400');
        if (btn.dataset.timeframe === tf) {
            btn.classList.add('bg-primary/20', 'text-primary');
            btn.classList.remove('text-gray-400');
        }
    });
    
    const newData = Array.from({length: 7}, () => Math.floor(Math.random() * 2000) + 9000);
    portfolioChart.data.datasets[0].data = newData;
    portfolioChart.update();
}

// Toast
function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const titleEl = document.getElementById('toast-title');
    const messageEl = document.getElementById('toast-message');

    titleEl.textContent = title;
    messageEl.textContent = message;
    
    if (type === 'error') {
        icon.className = 'w-8 h-8 rounded-full bg-danger/20 text-danger flex items-center justify-center';
        icon.innerHTML = '<i class="fas fa-exclamation"></i>';
    } else {
        icon.className = 'w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center';
        icon.innerHTML = '<i class="fas fa-check"></i>';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check auth first
    if (!checkAuth()) return;
    
    // Initialize user info
    initUserInfo();
    
    // Initialize charts
    initCharts();
    
    // Initial UI render
    updateUI();
    
    // Setup event listener
    const investAmount = document.getElementById('invest-amount');
    if (investAmount) {
        investAmount.addEventListener('input', updateInvestPreview);
    }
    
    // Start price simulation
    setInterval(() => {
        Object.keys(state.cryptoPrices).forEach(key => {
            const change = (Math.random() - 0.5) * 0.5;
            state.cryptoPrices[key].price *= (1 + change / 100);
            state.cryptoPrices[key].change = parseFloat((state.cryptoPrices[key].change + (Math.random() - 0.5)).toFixed(2));
        });
        
        state.investments.forEach(inv => {
            const currentPrice = state.cryptoPrices[inv.asset].price;
            inv.value = inv.amount * currentPrice;
            inv.profit = inv.value - inv.invested;
        });
        
        state.portfolioValue = state.investments.reduce((sum, inv) => sum + inv.value, 0);
        updateUI();
    }, 5000);
});
