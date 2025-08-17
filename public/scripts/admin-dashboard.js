// Admin Dashboard with Live Analytics
// Displays real-time analytics data and website metrics

class AdminDashboard {
    constructor() {
        this.charts = {};
        this.analyticsData = {
            visitors: [],
            pageViews: [],
            photoViews: [],
            blogEngagement: [],
            deviceTypes: [],
            topPages: [],
            recentActivity: []
        };
        
        this.init();
    }
    
    init() {
        this.setupCharts();
        this.loadAnalyticsData();
        this.updateLastRefresh();
        this.startRealTimeUpdates();
        
        // Update dashboard every 30 seconds
        setInterval(() => {
            this.loadAnalyticsData();
            this.updateLastRefresh();
        }, 30000);
    }
    
    setupCharts() {
        // Traffic Chart
        const trafficCtx = document.getElementById('trafficChart').getContext('2d');
        this.charts.traffic = new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Page Views',
                    data: [],
                    borderColor: '#88c0d0',
                    backgroundColor: 'rgba(136, 192, 208, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Unique Visitors',
                    data: [],
                    borderColor: '#81a1c1',
                    backgroundColor: 'rgba(129, 161, 193, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#d8dee9'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#d8dee9' },
                        grid: { color: 'rgba(216, 222, 233, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#d8dee9' },
                        grid: { color: 'rgba(216, 222, 233, 0.1)' }
                    }
                }
            }
        });
        
        // Device Chart
        const deviceCtx = document.getElementById('deviceChart').getContext('2d');
        this.charts.device = new Chart(deviceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Desktop', 'Mobile', 'Tablet'],
                datasets: [{
                    data: [60, 35, 5],
                    backgroundColor: ['#88c0d0', '#81a1c1', '#5e81ac'],
                    borderColor: '#2e3440',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#d8dee9',
                            padding: 20
                        }
                    }
                }
            }
        });
    }
    
    loadAnalyticsData() {
        // Simulate real analytics data (in production, this would fetch from Google Analytics API)
        this.simulateAnalyticsData();
        this.updateMetrics();
        this.updateTables();
        this.updateRecentActivity();
    }
    
    simulateAnalyticsData() {
        // Generate realistic analytics data for demonstration
        const now = new Date();
        const hoursAgo = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000);
        
        // Today's metrics
        this.analyticsData.todayVisitors = Math.floor(Math.random() * 50) + 20;
        this.analyticsData.todayPageViews = Math.floor(Math.random() * 150) + 50;
        this.analyticsData.todayPhotoViews = Math.floor(Math.random() * 80) + 30;
        this.analyticsData.avgReadingProgress = Math.floor(Math.random() * 30) + 45;
        
        // Generate hourly data for chart
        this.analyticsData.hourlyData = [];
        for (let i = 23; i >= 0; i--) {
            this.analyticsData.hourlyData.push({
                time: hoursAgo(i),
                visitors: Math.floor(Math.random() * 10) + 1,
                pageViews: Math.floor(Math.random() * 25) + 5
            });
        }
        
        // Top pages
        this.analyticsData.topPages = [
            { page: '/gallery.html', views: 45, percentage: 28.5 },
            { page: '/', views: 38, percentage: 24.1 },
            { page: '/blog/', views: 32, percentage: 20.3 },
            { page: '/map.html', views: 24, percentage: 15.2 },
            { page: '/fitness.html', views: 19, percentage: 12.0 }
        ];
        
        // Popular photos
        this.analyticsData.popularPhotos = [
            { photo: 'Golden Gate Bridge (Foggy)', views: 23, source: 'Gallery' },
            { photo: 'Big Ben', views: 19, source: 'Map' },
            { photo: 'Death Valley', views: 16, source: 'Gallery' },
            { photo: 'Amsterdam Canal', views: 14, source: 'Gallery' },
            { photo: 'Barcelona, Spain', views: 12, source: 'Map' }
        ];
        
        // Recent activity
        this.analyticsData.recentActivity = [
            { time: new Date(now.getTime() - 2 * 60 * 1000), action: 'Photo viewed', details: 'Golden Gate Bridge (Foggy)' },
            { time: new Date(now.getTime() - 5 * 60 * 1000), action: 'Page visit', details: '/gallery.html' },
            { time: new Date(now.getTime() - 8 * 60 * 1000), action: 'Blog read', details: 'This is a test - 75% progress' },
            { time: new Date(now.getTime() - 12 * 60 * 1000), action: 'Map interaction', details: 'Europe filter applied' },
            { time: new Date(now.getTime() - 15 * 60 * 1000), action: 'Social click', details: 'Instagram' }
        ];
    }
    
    updateMetrics() {
        // Update metric cards
        document.getElementById('todayVisitors').textContent = this.analyticsData.todayVisitors;
        document.getElementById('pageViews').textContent = this.analyticsData.todayPageViews;
        document.getElementById('photoViews').textContent = this.analyticsData.todayPhotoViews;
        document.getElementById('blogEngagement').textContent = this.analyticsData.avgReadingProgress + '%';
        
        // Update change indicators (simulate growth)
        this.updateChangeIndicator('visitorsChange', 12);
        this.updateChangeIndicator('pageViewsChange', 8);
        this.updateChangeIndicator('photoViewsChange', -3);
        this.updateChangeIndicator('blogEngagementChange', 5);
    }
    
    updateChangeIndicator(elementId, changePercent) {
        const element = document.getElementById(elementId);
        const isPositive = changePercent >= 0;
        
        element.textContent = `${isPositive ? '+' : ''}${changePercent}% vs yesterday`;
        element.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
    }
    
    updateTables() {
        // Update top pages table
        const topPagesTable = document.getElementById('topPagesTable');
        topPagesTable.innerHTML = this.analyticsData.topPages.map(page => `
            <tr>
                <td>${page.page}</td>
                <td>${page.views}</td>
                <td>${page.percentage}%</td>
            </tr>
        `).join('');
        
        // Update popular photos table
        const popularPhotosTable = document.getElementById('popularPhotosTable');
        popularPhotosTable.innerHTML = this.analyticsData.popularPhotos.map(photo => `
            <tr>
                <td>${photo.photo}</td>
                <td>${photo.views}</td>
                <td>${photo.source}</td>
            </tr>
        `).join('');
    }
    
    updateRecentActivity() {
        const recentActivityContainer = document.getElementById('recentActivity');
        
        recentActivityContainer.innerHTML = this.analyticsData.recentActivity.map(activity => `
            <div style="padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${activity.action}</strong>
                        <div style="color: var(--accent-secondary); font-size: 0.9em;">${activity.details}</div>
                    </div>
                    <div style="color: var(--accent-secondary); font-size: 0.8em;">
                        ${this.formatTimeAgo(activity.time)}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    updateTrafficChart(period = '24h') {
        // Update active button
        document.querySelectorAll('.time-filter button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        let labels, data;
        
        if (period === '24h') {
            labels = this.analyticsData.hourlyData.map(d => 
                d.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            );
            data = {
                pageViews: this.analyticsData.hourlyData.map(d => d.pageViews),
                visitors: this.analyticsData.hourlyData.map(d => d.visitors)
            };
        } else {
            // Simulate weekly/monthly data
            const days = period === '7d' ? 7 : 30;
            labels = Array.from({ length: days }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (days - 1 - i));
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            data = {
                pageViews: Array.from({ length: days }, () => Math.floor(Math.random() * 100) + 50),
                visitors: Array.from({ length: days }, () => Math.floor(Math.random() * 50) + 25)
            };
        }
        
        this.charts.traffic.data.labels = labels;
        this.charts.traffic.data.datasets[0].data = data.pageViews;
        this.charts.traffic.data.datasets[1].data = data.visitors;
        this.charts.traffic.update();
    }
    
    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
    
    updateLastRefresh() {
        document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
    }
    
    startRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            // Randomly update some metrics
            if (Math.random() > 0.7) {
                this.analyticsData.todayPageViews += Math.floor(Math.random() * 3) + 1;
                document.getElementById('pageViews').textContent = this.analyticsData.todayPageViews;
                
                // Add to recent activity
                const actions = ['Page visit', 'Photo viewed', 'Social click', 'Blog read'];
                const pages = ['/gallery.html', '/map.html', '/blog/', '/', '/fitness.html'];
                
                this.analyticsData.recentActivity.unshift({
                    time: new Date(),
                    action: actions[Math.floor(Math.random() * actions.length)],
                    details: pages[Math.floor(Math.random() * pages.length)]
                });
                
                // Keep only last 5 activities
                this.analyticsData.recentActivity = this.analyticsData.recentActivity.slice(0, 5);
                this.updateRecentActivity();
            }
        }, 10000); // Every 10 seconds
    }
}

// Export functions
function exportAnalytics(format) {
    const data = {
        date: new Date().toISOString(),
        metrics: {
            visitors: dashboard.analyticsData.todayVisitors,
            pageViews: dashboard.analyticsData.todayPageViews,
            photoViews: dashboard.analyticsData.todayPhotoViews,
            blogEngagement: dashboard.analyticsData.avgReadingProgress
        },
        topPages: dashboard.analyticsData.topPages,
        popularPhotos: dashboard.analyticsData.popularPhotos
    };
    
    if (format === 'csv') {
        exportToCSV(data);
    } else if (format === 'json') {
        exportToJSON(data);
    }
    
    // Track export
    if (typeof trackEvent !== 'undefined') {
        trackEvent('analytics_export', 'Admin', format);
    }
}

function exportToCSV(data) {
    const csv = [
        'Metric,Value',
        `Visitors,${data.metrics.visitors}`,
        `Page Views,${data.metrics.pageViews}`,
        `Photo Views,${data.metrics.photoViews}`,
        `Blog Engagement,${data.metrics.blogEngagement}%`,
        '',
        'Top Pages',
        'Page,Views,Percentage',
        ...data.topPages.map(page => `${page.page},${page.views},${page.percentage}%`)
    ].join('\n');
    
    downloadFile(csv, 'analytics-export.csv', 'text/csv');
}

function exportToJSON(data) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'analytics-export.json', 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function generateReport() {
    alert('PDF report generation would be implemented with a service like jsPDF or server-side PDF generation.');
    
    // Track report generation
    if (typeof trackEvent !== 'undefined') {
        trackEvent('report_generated', 'Admin', 'pdf');
    }
}

function refreshDashboard() {
    dashboard.loadAnalyticsData();
    dashboard.updateLastRefresh();
    
    // Show refresh animation
    const refreshBtn = event.target;
    refreshBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
    }, 500);
    
    // Track manual refresh
    if (typeof trackEvent !== 'undefined') {
        trackEvent('dashboard_refresh', 'Admin', 'manual');
    }
}

// Global reference
let dashboard;

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdminDashboard();
});