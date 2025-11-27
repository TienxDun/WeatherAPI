const API_KEY = '7e2bdcc3e4c7454293c173038252711';
const BASE_URL = 'https://api.weatherapi.com/v1/forecast.json';

let isFahrenheit = false;  // Default Celsius

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
    // Re-fetch if there's current data
    const currentQuery = document.getElementById('cityInput').value || 'London';  // Default if empty
    fetchWeather(currentQuery);
});

// Load history on page load
updateHistoryDisplay();

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

function fetchWeather(query) {
    const city = document.getElementById('cityInput').value;
    if (!city) return alert('Vui lòng nhập tên thành phố!');
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('weatherResult').innerHTML = '';
    document.getElementById('forecastResult').innerHTML = '';
    
    fetch(`${BASE_URL}?key=${API_KEY}&q=${city}&days=7`)
        .then(response => response.json())
        .then(data => {
            // Hide loading
            document.getElementById('loading').style.display = 'none';
            console.log('API Response:', data);  // Debug: log data trả về
            if (data.location && data.current) {
                const temp = data.current.temp_c;
                const description = data.current.condition.text;
                const humidity = data.current.humidity;
                const icon = `https:${data.current.condition.icon}`;  // Icon URL from API
                document.getElementById('weatherResult').innerHTML = `
                    <h2>${data.location.name}, ${data.location.country}</h2>
                    <img src="${icon}" alt="Icon">
                    <p>Nhiệt độ: ${temp}°C</p>
                    <p>Mô tả: ${description}</p>
                    <p>Độ ẩm: ${humidity}%</p>
                `;
                
                // Hiển thị forecast
                if (data.forecast && data.forecast.forecastday) {
                    let forecastHTML = '<h3>Dự báo 7 ngày</h3><div class="forecast-container">';
                    data.forecast.forecastday.forEach(day => {
                        const date = new Date(day.date).toLocaleDateString('vi-VN');
                        const maxTemp = day.day.maxtemp_c;
                        const minTemp = day.day.mintemp_c;
                        const condition = day.day.condition.text;
                        const dayIcon = `https:${day.day.condition.icon}`;
                        forecastHTML += `
                            <div class="forecast-day">
                                <p>${date}</p>
                                <img src="${dayIcon}" alt="Icon">
                                <p>${maxTemp}°C / ${minTemp}°C</p>
                                <p>${condition}</p>
                            </div>
                        `;
                    });
                    forecastHTML += '</div>';
                    document.getElementById('forecastResult').innerHTML = forecastHTML;
                }
                showToast('Đã tải thời tiết thành công!', 'success');
            } else {
                document.getElementById('weatherResult').innerHTML = '<p>Không tìm thấy thành phố hoặc lỗi API!</p>';
                document.getElementById('forecastResult').innerHTML = '';
                showToast('Không tìm thấy thành phố!', 'error');
            }
        })
        .catch(error => {
            // Hide loading
            document.getElementById('loading').style.display = 'none';
            console.error(error);
            document.getElementById('weatherResult').innerHTML = '<p>Lỗi mạng hoặc API!</p>';
            showToast('Lỗi mạng! Vui lòng thử lại.', 'error');
        });
};

function fetchWeather(query) {
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('weatherResult').innerHTML = '';
    document.getElementById('forecastResult').innerHTML = '';
    
    const units = isFahrenheit ? 'us' : 'metric';  // us for Fahrenheit, metric for Celsius
    fetch(`${BASE_URL}?key=${API_KEY}&q=${query}&days=7`)
        .then(response => response.json())
        .then(data => {
            // Hide loading
            document.getElementById('loading').style.display = 'none';
            console.log('API Response:', data);  // Debug: log data trả về
            if (data.location && data.current) {
                const temp = isFahrenheit ? data.current.temp_f : data.current.temp_c;
                const unit = isFahrenheit ? '°F' : '°C';
                const description = data.current.condition.text;
                const humidity = data.current.humidity;
                const icon = `https:${data.current.condition.icon}`;
                document.getElementById('weatherResult').innerHTML = `
                    <h2>${data.location.name}, ${data.location.country}</h2>
                    <img src="${icon}" alt="Icon">
                    <p>Nhiệt độ: ${temp}${unit}</p>
                    <p>Mô tả: ${description}</p>
                    <p>Độ ẩm: ${humidity}%</p>
                `;
                
                // Hiển thị forecast
                if (data.forecast && data.forecast.forecastday) {
                    let forecastHTML = '<h3>Dự báo 7 ngày</h3><div class="forecast-container">';
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
                                <p>${maxTemp}${unit} / ${minTemp}${unit}</p>
                                <p>${condition}</p>
                            </div>
                        `;
                    });
                    forecastHTML += '</div>';
                    document.getElementById('forecastResult').innerHTML = forecastHTML;
                }
                showToast('Đã tải thời tiết thành công!', 'success');
                // Save to history if it's a city name (not lat,lon)
                if (!query.includes(',')) saveToHistory(query);
            } else {
                document.getElementById('weatherResult').innerHTML = '<p>Không tìm thấy vị trí hoặc lỗi API!</p>';
                document.getElementById('forecastResult').innerHTML = '';
                showToast('Không tìm thấy vị trí!', 'error');
            }
        })
        .catch(error => {
            // Hide loading
            document.getElementById('loading').style.display = 'none';
            console.error(error);
            document.getElementById('weatherResult').innerHTML = '<p>Lỗi mạng hoặc API!</p>';
            showToast('Lỗi mạng! Vui lòng thử lại.', 'error');
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