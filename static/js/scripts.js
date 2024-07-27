let sidebarOpen = false;
const sidebar = document.getElementById('sidebar');
const gridContainer = document.querySelector('.grid-container');

function openSidebar() {
  if (!sidebarOpen) {
    sidebar.classList.add('sidebar-responsive');
    sidebar.classList.remove('sidebar-hidden');
    gridContainer.classList.remove('expanded');
    sidebarOpen = true;
  }
}

function closeSidebar() {
  if (sidebarOpen) {
    sidebar.classList.remove('sidebar-responsive');
    sidebar.classList.add('sidebar-hidden');
    gridContainer.classList.add('expanded');
    sidebarOpen = false;
  }
}

function toggleSidebar() {
  sidebarOpen ? closeSidebar() : openSidebar();
}

document.querySelector('.menu-icon').onclick = toggleSidebar;

// Function to process Excel file
document.getElementById("fileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    processData(jsonData);
  };

  reader.readAsArrayBuffer(file);
});

function processData(data) {
  const studentNames = new Set(data.map((item) => item.Name));
  const courseNames = new Set(data.map((item) => item.CourseName));
  const totalStudents = studentNames.size;
  const totalCourses = courseNames.size;

  // Update the dashboard counts
  document.getElementById("total-students").textContent = totalStudents;
  document.getElementById("total-courses").textContent = totalCourses;

  // Process data for charts
  const studentsPerCourse = data.reduce((acc, curr) => {
    acc[curr.CourseName] = (acc[curr.CourseName] || 0) + 1;
    return acc;
  }, {});

  // Filter courses with more than 100 registrations
  const filteredCourses = Object.entries(studentsPerCourse).filter(
    ([course, count]) => count > 100
  );
  const sortedFilteredCourses = filteredCourses.sort((a, b) => b[1] - a[1]);
  const topCourses = sortedFilteredCourses.map(([course]) =>
    abbreviateLabel(course)
  );
  const topCourseCounts = sortedFilteredCourses.map(([_, count]) => count);

  const genderDistribution = {
    labels: ["Female", "Male"],
    datasets: [
      {
        label: "Gender",
        data: [
          data.filter((student) => student.Gender === "Female").length,
          data.filter((student) => student.Gender === "Male").length,
        ],
        backgroundColor: ["#2962ff", "#d50000"],
      },
    ],
  };

  const qualifications = data.reduce((acc, curr) => {
    acc[curr.Qualification] = (acc[curr.Qualification] || 0) + 1;
    return acc;
  }, {});

  const qualificationDistribution = {
    labels: Object.keys(qualifications),
    datasets: [
      {
        label: "Qualifications",
        data: Object.values(qualifications),
        backgroundColor: [
          "#2962ff",
          "#d50000",
          "#2e7d32",
          "#ff6d00",
          "#583cb3",
        ],
      },
    ],
  };

  const professionDistribution = {
    labels: ["Student", "Faculty"],
    datasets: [
      {
        label: "Profession",
        data: [
          data.filter((person) => person.Profession === "student").length,
          data.filter((person) => person.Profession === "faculty").length,
        ],
        backgroundColor: ["#2962ff", "#d50000"],
      },
    ],
  };

  // Process department data
  const departments = data.reduce((acc, curr) => {
    acc[curr.Department] = (acc[curr.Department] || 0) + 1;
    return acc;
  }, {});

  const departmentEntries = Object.entries(departments);
  const sortedDepartments = departmentEntries.sort((a, b) => b[1] - a[1]);
  const topDepartments = sortedDepartments.slice(0, 3);
  const otherDepartmentsCount = sortedDepartments
    .slice(3)
    .reduce((acc, curr) => acc + curr[1], 0);

  const departmentLabels = topDepartments
    .map(([dept]) => dept)
    .concat("Others");
  const departmentData = topDepartments
    .map(([, count]) => count)
    .concat(otherDepartmentsCount);

  // Update Charts
  updateBarChart(topCourses, topCourseCounts);
  updatePieChart(genderDistribution);
  updateQualificationsChart(qualificationDistribution);
  updateStudentFacultyChart(professionDistribution);
  updateDepartmentChart(departmentLabels, departmentData);
  updateMap(data); // Call to update the map
}

function abbreviateLabel(label) {
  return label.length > 10 ? label.slice(0, 10) + "..." : label;
}

function updateBarChart(topCourses, topCourseCounts) {
  const barCtx = document.getElementById("bar-chart").getContext("2d");
  new Chart(barCtx, {
    type: "bar",
    data: {
      labels: topCourses,
      datasets: [
        {
          label: "Students",
          data: topCourseCounts,
          backgroundColor: topCourses.map((_, i) => `hsl(${i * 60}, 70%, 50%)`),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 50, // Set the step size to 50
            max: Math.max(...topCourseCounts) + 10, // Set the maximum value dynamically
          },
        },
        x: {
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 45,
            padding: 10,
            font: {
              size: 10,
            },
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Courses with More Than 100 Registrations",
        },
      },
    },
  });
}

function updatePieChart(data) {
  const pieCtx = document.getElementById("pie-chart").getContext("2d");
  new Chart(pieCtx, {
    type: "pie",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Gender Distribution",
        },
      },
    },
  });
}

function updateQualificationsChart(data) {
  const qualificationsCtx = document
    .getElementById("qualifications-chart")
    .getContext("2d");
  new Chart(qualificationsCtx, {
    type: "doughnut",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Qualifications Distribution",
        },
      },
    },
  });
}

function updateStudentFacultyChart(data) {
  const studentFacultyCtx = document
    .getElementById("student-faculty-chart")
    .getContext("2d");
  new Chart(studentFacultyCtx, {
    type: "pie",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Student vs Faculty",
        },
      },
    },
  });
}

function updateDepartmentChart(labels, data) {
  const departmentCtx = document
    .getElementById("department-chart")
    .getContext("2d");
  new Chart(departmentCtx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Departments",
          data: data,
          backgroundColor: [
            "#2962ff",
            "#d50000",
            "#2e7d32",
            "#ff6d00",
            "#583cb3",
            "#9e9e9e",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Top Departments",
        },
      },
    },
  });
}

// Existing map function
function updateMap(data) {
  const cityCounts = data.reduce((acc, curr) => {
    acc[curr.City] = (acc[curr.City] || 0) + 1;
    return acc;
  }, {});

  const map = L.map("map").setView([20.5937, 78.9629], 5); // Centered on India
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
  }).addTo(map);

  const markers = L.markerClusterGroup();

  for (const [city, count] of Object.entries(cityCounts)) {
    const latLng = getLatLngFromCity(city);
    if (latLng) {
      const marker = L.marker(latLng).bindPopup(
        `<b>${city}</b><br>Students: ${count}`
      );
      markers.addLayer(marker);
    }
  }

  map.addLayer(markers);
}

// Placeholder function to get latitude and longitude from a city name.
// Replace with actual geocoding if needed.
function getLatLngFromCity(city) {
  const cities = {
    Mangalore: [12.9141, 74.856],
    Puttur: [12.7586, 75.2072],
    OtherCity1: [11.1111, 76.1111],
    OtherCity2: [22.2222, 77.2222],
  };

  return cities[city] || null;
}

// Existing button event listener
document.getElementById("getRecommendationButton").addEventListener("click", function () {
  const userName = document.getElementById("userNameInput").value;
  if (userName) {
    fetch("/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_name: userName }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
        } else {
          displayRecommendations([data.course_title]);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    alert("Please enter a user name.");
  }
});

function displayRecommendations(recommendations) {
  const recommendationResult = document.getElementById("recommendationResult");
  recommendationResult.innerHTML =
    "<h3>Recommended Courses:</h3><ul>" +
    recommendations.map((course) => `<li>${course}</li>`).join("") +
    "</ul>";
}

const ctx = document.getElementById('line-chart').getContext('2d');
        const lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{ 
                    data: [],
                    label: "Enrollments",
                    borderColor: "#3e95cd",
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow the chart to fill the container
                plugins: {
                    title: {
                        display: true,
                        text: 'Enrollment Over Time'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Timeline'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Enrollments'
                        }
                    }
                }
            }
        });

        // Function to update chart data
        function updateChartData(newData) {
            const labels = Object.keys(newData);
            const data = Object.values(newData);

            lineChart.data.labels = labels;
            lineChart.data.datasets[0].data = data;
            lineChart.update();
        }

        // Example new data
        const newTimelineData = {
            "Jan-April 2019": 82,
            "Jan-April 2020": 63,
            "Jan-April 2021": 204,
            "Jan-April 2022": 48,
            "Jan-April 2023": 136,
            "Jul-Dec 2020": 254,
            "Jul-Dec 2021": 26,
            "Jul-Dec 2022": 72,
            "Jul-Dec 2023": 28,
            "Jul-Dec 2024": 99,
            "Jan-April 2024": 120 // New data
        };

        // Update chart with new data
        updateChartData(newTimelineData);
