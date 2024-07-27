// SIDEBAR TOGGLE
let sidebarOpen = false;
const sidebar = document.getElementById('sidebar');

function openSidebar() {
  if (!sidebarOpen) {
    sidebar.classList.add('sidebar-responsive');
    sidebarOpen = true;
  }
}

function closeSidebar() {
  if (sidebarOpen) {
    sidebar.classList.remove('sidebar-responsive');
    sidebarOpen = false;
  }
}

// Function to process Excel file
document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    processData(jsonData);
  };

  reader.readAsArrayBuffer(file);
});

function processData(data) {
  const studentNames = new Set(data.map(item => item.Name));
  const courseNames = new Set(data.map(item => item.CourseName));
  const totalStudents = studentNames.size;
  const totalCourses = courseNames.size;

  // Update the dashboard counts
  document.getElementById('total-students').textContent = totalStudents;
  document.getElementById('total-courses').textContent = totalCourses;

  // Process data for charts
  const studentsPerCourse = data.reduce((acc, curr) => {
    acc[curr.CourseName] = (acc[curr.CourseName] || 0) + 1;
    return acc;
  }, {});

  // Filter courses with more than 100 registrations
  const filteredCourses = Object.entries(studentsPerCourse).filter(([course, count]) => count > 100);
  const sortedFilteredCourses = filteredCourses.sort((a, b) => b[1] - a[1]);
  const topCourses = sortedFilteredCourses.map(([course]) => course);
  const topCourseCounts = sortedFilteredCourses.map(([_, count]) => count);

  const genderDistribution = {
    labels: ['Female', 'Male'],
    datasets: [{
      label: 'Gender',
      data: [
        data.filter(student => student.Gender === 'Female').length,
        data.filter(student => student.Gender === 'Male').length,
      ],
      backgroundColor: ['#2962ff', '#d50000'],
    }]
  };

  const qualifications = data.reduce((acc, curr) => {
    acc[curr.Qualification] = (acc[curr.Qualification] || 0) + 1;
    return acc;
  }, {});

  const qualificationDistribution = {
    labels: Object.keys(qualifications),
    datasets: [{
      label: 'Qualifications',
      data: Object.values(qualifications),
      backgroundColor: ['#2962ff', '#d50000', '#2e7d32', '#ff6d00', '#583cb3'],
    }]
  };

  const professionDistribution = {
    labels: ['Student', 'Faculty'],
    datasets: [{
      label: 'Profession',
      data: [
        data.filter(person => person.Profession === 'student').length,
        data.filter(person => person.Profession === 'faculty').length,
      ],
      backgroundColor: ['#2962ff', '#d50000'],
    }]
  };

  // Process department data
  const departments = data.reduce((acc, curr) => {
    acc[curr.Department] = (acc[curr.Department] || 0) + 1;
    return acc;
  }, {});

  const departmentEntries = Object.entries(departments);
  const sortedDepartments = departmentEntries.sort((a, b) => b[1] - a[1]);
  const topDepartments = sortedDepartments.slice(0, 3);
  const otherDepartmentsCount = sortedDepartments.slice(3).reduce((acc, curr) => acc + curr[1], 0);

  const departmentLabels = topDepartments.map(([dept]) => dept).concat('Others');
  const departmentData = topDepartments.map(([, count]) => count).concat(otherDepartmentsCount);

  // Update Charts
  updateBarChart(topCourses, topCourseCounts);
  updatePieChart(genderDistribution);
  updateQualificationsChart(qualificationDistribution);
  updateStudentFacultyChart(professionDistribution);
  updateDepartmentChart(departmentLabels, departmentData);
  updateMap(data);
}

function updateBarChart(topCourses, topCourseCounts) {
  const barCtx = document.getElementById('bar-chart').getContext('2d');
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: topCourses,
      datasets: [{
        label: 'Students',
        data: topCourseCounts,
        backgroundColor: topCourses.map((_, i) => `hsl(${i * 60}, 70%, 50%)`),
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allow the chart to take full height
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 50, // Set the step size to 10
            max: Math.max(...topCourseCounts) + 10 // Set the maximum value dynamically
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Courses with More Than 100 Registrations'
        }
      }
    }
  });

  // Set a specific height for the chart
  document.getElementById('bar-chart').style.height = '250px'; // Adjust this value as needed
}

function updatePieChart(data) {
  const pieCtx = document.getElementById('pie-chart').getContext('2d');
  new Chart(pieCtx, {
    type: 'pie',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Gender Distribution'
        }
      }
    }
  });
}

function updateQualificationsChart(data) {
  const qualificationsCtx = document.getElementById('qualifications-chart').getContext('2d');
  new Chart(qualificationsCtx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allow the chart to take full height
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Qualifications Distribution'
        }
      }
    }
  });

  // Set a specific height for the chart
  document.getElementById('qualifications-chart').style.height = '250px'; // Adjust this value as needed
}

function updateStudentFacultyChart(data) {
  const studentFacultyCtx = document.getElementById('student-faculty-chart').getContext('2d');
  new Chart(studentFacultyCtx, {
    type: 'pie',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Student vs Faculty Ratio'
        }
      }
    }
  });
}

function updateDepartmentChart(labels, data) {
  const departmentCtx = document.getElementById('department-chart').getContext('2d');
  new Chart(departmentCtx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Departments',
        data: data,
        backgroundColor: ['#2962ff', '#d50000', '#2e7d32', '#ff6d00', '#583cb3'],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Count of Users by Department'
        }
      }
    }
  });
}

function updateMap(data) {
  const map = L.map('map').setView([20, 77], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  const markers = L.markerClusterGroup();

  data.forEach(student => {
    const marker = L.marker([student.Latitude, student.Longitude]).bindPopup(`${student.Name}, ${student.City}`);
    markers.addLayer(marker);
  });

  map.addLayer(markers);
}
