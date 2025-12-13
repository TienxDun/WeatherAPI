import CONFIG from './config.js';

const API_KEY = CONFIG.API_KEY;
const BASE_URL = CONFIG.BASE_URL; // Should be https://api.weatherapi.com/v1/forecast.json

// Load unit preference from localStorage
let isFahrenheit = JSON.parse(localStorage.getItem('weatherUnit')) || false;  // Default Celsius

// Store current weather data
let currentWeatherData = null;

// Load history from localStorage
let searchHistory = JSON.parse(localStorage.getItem('weatherHistory')) || [];

// Function to save to history
function saveToHistory(city) {
    if (!searchHistory.includes(city)) {
        searchHistory.unshift(city);  // Add to beginning
        if (searchHistory.length > 5) searchHistory.pop();  // Limit to 5
        localStorage.setItem('weatherHistory', JSON.stringify(searchHistory));
        updateHistoryDisplay();
    }
}

// Function to update history display
function updateHistoryDisplay() {
    const historyDiv = document.querySelector('.history');
    if (searchHistory.length > 0) {
        document.querySelector('.history-section').style.display = 'block';
        historyDiv.innerHTML = searchHistory.map(city => 
            `<button onclick="fetchWeather('${city}')">${city}</button>`
        ).join(' ');
    } else {
        document.querySelector('.history-section').style.display = 'none';
    }
}

// Function to show toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.style.display = 'none', 300);
    }, 3000);
}

// Load theme from localStorage
let currentTheme = localStorage.getItem('weatherTheme') || 'green';
document.body.className = currentTheme;

// Update active radio button
document.querySelector(`input[name="theme"][value="${currentTheme}"]`).checked = true;

// Theme radio listeners
document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const theme = radio.value;
        document.body.className = theme;
        localStorage.setItem('weatherTheme', theme);
    });
});

document.getElementById('unitToggle').addEventListener('change', (e) => {
    isFahrenheit = e.target.checked;
    localStorage.setItem('weatherUnit', JSON.stringify(isFahrenheit));
    // Update display if we have current data
    if (currentWeatherData) {
        updateWeatherDisplay(currentWeatherData);
    } else {
        // If no data, fetch default location
        fetchWeather('Ho Chi Minh');
    }
});

// Load history on page load
updateHistoryDisplay();

// Set toggle state based on saved preference
document.getElementById('unitToggle').checked = isFahrenheit;

document.getElementById('getLocationBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        showToast('Đang lấy vị trí...', 'success');
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeather(`${lat},${lon}`);
        }, error => {
            showToast('Không thể lấy vị trí! Vui lòng cho phép truy cập.', 'error');
        });
    } else {
        showToast('Trình duyệt không hỗ trợ geolocation.', 'error');
    }
});

// Function to update weather display
function updateWeatherDisplay(data) {
    const temp = isFahrenheit ? data.current.temp_f : data.current.temp_c;
    const unit = isFahrenheit ? '°F' : '°C';
    const description = data.current.condition.text;
    const humidity = data.current.humidity;
    const icon = `https:${data.current.condition.icon}`;
    
    // Main Weather Card
    document.getElementById('weatherResult').innerHTML = `
        <h2>${data.location.name}, ${data.location.country}</h2>
        <img src="${icon}" alt="Icon">
        <p>Nhiệt độ: ${Math.round(temp)}${unit}</p>
        <p>Mô tả: ${description}</p>
        <p>Độ ẩm: ${humidity}%</p>
        <p>Cập nhật: ${data.current.last_updated}</p>
    `;

    // Extra Info (AQI, Astro, UV)
    let extraInfoHTML = '';
    
    // AQI
    if (data.current.air_quality) {
        const aqi = data.current.air_quality['us-epa-index'];
        let aqiText = 'Tốt';
        if (aqi > 1) aqiText = 'Trung bình';
        if (aqi > 2) aqiText = 'Kém';
        if (aqi > 3) aqiText = 'Xấu';
        if (aqi > 4) aqiText = 'Rất xấu';
        if (aqi > 5) aqiText = 'Nguy hại';
        
        extraInfoHTML += `
            <div class="info-card">
                <h4>Chất lượng không khí</h4>
                <p>Chỉ số EPA: ${aqi}</p>
                <p>Đánh giá: ${aqiText}</p>
                <p>PM2.5: ${data.current.air_quality.pm2_5.toFixed(1)}</p>
            </div>
        `;
    }

    // Astronomy (from first forecast day)
    if (data.forecast && data.forecast.forecastday && data.forecast.forecastday.length > 0) {
        const astro = data.forecast.forecastday[0].astro;
        extraInfoHTML += `
            <div class="info-card">
                <h4>Thiên văn</h4>
                <p>🌅 Bình minh: ${astro.sunrise}</p>
                <p>🌇 Hoàng hôn: ${astro.sunset}</p>
                <p>🌑 Mặt trăng: ${astro.moon_phase}</p>
            </div>
        `;
    }

    // UV Index
    extraInfoHTML += `
        <div class="info-card">
            <h4>Chỉ số UV</h4>
            <p>${data.current.uv}</p>
            <p>${data.current.uv > 5 ? 'Cao - Cần bảo vệ' : 'Thấp/Trung bình'}</p>
        </div>
    `;

    document.getElementById('extraInfo').innerHTML = extraInfoHTML;

    // Alerts
    const alertsDiv = document.getElementById('alertsResult');
    if (data.alerts && data.alerts.alert && data.alerts.alert.length > 0) {
        alertsDiv.innerHTML = '<h3>⚠️ Cảnh báo thời tiết</h3>' + data.alerts.alert.map(alert => `
            <div class="alert-item">
                <h4>${alert.event}</h4>
                <p>${alert.desc}</p>
                <p><small>Hiệu lực: ${new Date(alert.effective).toLocaleString()} - ${new Date(alert.expires).toLocaleString()}</small></p>
            </div>
        `).join('');
        alertsDiv.style.display = 'block';
    } else {
        alertsDiv.innerHTML = '';
        alertsDiv.style.display = 'none';
    }
    
    // Update forecast
    if (data.forecast && data.forecast.forecastday) {
        let forecastHTML = '<h3>Dự báo thời tiết</h3><div class="forecast-container">';
        data.forecast.forecastday.forEach(day => {
            const date = new Date(day.date).toLocaleDateString('vi-VN');
            const maxTemp = isFahrenheit ? day.day.maxtemp_f : day.day.maxtemp_c;
            const minTemp = isFahrenheit ? day.day.mintemp_f : day.day.mintemp_c;
            const condition = day.day.condition.text;
            const dayIcon = `https:${day.day.condition.icon}`;
            forecastHTML += `
                <div class="forecast-day">
                    <p>${date}</p>
                    <img src="${dayIcon}" alt="Icon">
                    <p>${Math.round(maxTemp)}${unit} / ${Math.round(minTemp)}${unit}</p>
                    <p>${condition}</p>
                    <p>☔ ${day.day.daily_chance_of_rain}%</p>
                </div>
            `;
        });
        forecastHTML += '</div>';
        document.getElementById('forecastResult').innerHTML = forecastHTML;
    }
}

function fetchWeather(query) {
    // Show loading, hide others
    document.getElementById('loading').style.display = 'block';
    document.getElementById('welcomeState').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Clear previous results
    document.getElementById('weatherResult').innerHTML = '';
    document.getElementById('forecastResult').innerHTML = '';
    document.getElementById('extraInfo').innerHTML = '';
    document.getElementById('alertsResult').innerHTML = '';
    
    // Use WeatherAPI.com endpoint
    // Request 7 days (might be limited to 3 on free plan), AQI, and Alerts
    fetch(`${BASE_URL}?key=${API_KEY}&q=${query}&days=7&aqi=yes&alerts=yes&lang=vi`)
        .then(response => response.json())
        .then(data => {
            // Hide loading
            document.getElementById('loading').style.display = 'none';
            console.log('API Response:', data);
            
            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.location && data.current) {
                // Show results
                document.getElementById('resultsSection').style.display = 'flex'; // or block, but flex is defined in CSS
                
                // Store current data
                currentWeatherData = data;
                
                // Update display
                updateWeatherDisplay(data);
                
                showToast('Đã tải thời tiết thành công!', 'success');
                // Save to history if it's a city name (not lat,lon)
                if (!query.includes(',')) saveToHistory(data.location.name);
            }
        })
        .catch(error => {
            // Hide loading, show welcome state again
            document.getElementById('loading').style.display = 'none';
            document.getElementById('welcomeState').style.display = 'block';
            
            console.error(error);
            showToast(`Lỗi: ${error.message || 'Không thể tải dữ liệu'}`, 'error');
        });
}

document.getElementById('getWeatherBtn').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    if (!city) return alert('Vui lòng nhập tên thành phố!');
    fetchWeather(city);
});

document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = document.getElementById('cityInput').value;
        if (!city) return alert('Vui lòng nhập tên thành phố!');
        fetchWeather(city);
    }
});

// Make fetchWeather globally available for history buttons
window.fetchWeather = fetchWeather;