document.addEventListener('DOMContentLoaded', () => {
    fetch('dataset.json')
        .then(response => response.json())
        .then(data => {
            console.log('Data loaded:', data);  // Debugging line

            // Initialize counts
            const courseCounts = {};
            const genderCounts = { Male: 0, Female: 0 };
            const professionCounts = { student: 0, faculty: 0 };
            const departmentCounts = {};

            data.forEach(record => {
                // Count courses
                const courseName = record.CourseName;
                courseCounts[courseName] = (courseCounts[courseName] || 0) + 1;

                // Count gender
                genderCounts[record.Gender] = (genderCounts[record.Gender] || 0) + 1;

                // Count profession
                professionCounts[record.Profession] = (professionCounts[record.Profession] || 0) + 1;

                // Count department
                const department = record.Department;
                departmentCounts[department] = (departmentCounts[department] || 0) + 1;
            });

            console.log('Course Counts:', courseCounts); // Debugging line
            console.log('Gender Counts:', genderCounts); // Debugging line
            console.log('Profession Counts:', professionCounts); // Debugging line
            console.log('Department Counts:', departmentCounts); // Debugging line

            // Render charts
            renderChart('courseCountChart', 'bar', 'Number of Users Registered for Each Course', 'Course Name', 'Number of Users', Object.keys(courseCounts), Object.values(courseCounts));
            renderChart('genderRatioChart', 'pie', 'Male to Female Ratio', '', '', Object.keys(genderCounts), Object.values(genderCounts));
            renderChart('professionRatioChart', 'pie', 'Student to Faculty Ratio', '', '', Object.keys(professionCounts), Object.values(professionCounts));
            renderChart('departmentChart', 'bar', 'Department and User Counts', 'Department', 'Number of Users', Object.keys(departmentCounts), Object.values(departmentCounts));
        })
        .catch(error => console.error('Error loading data:', error));
});

function renderChart(id, type, title, xLabel, yLabel, labels, data) {
    const ctx = document.getElementById(id).getContext('2d');
    new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: yLabel,
                data: data,
                backgroundColor: type === 'pie' ? 'rgba(75, 192, 192, 0.2)' : 'rgba(75, 192, 192, 0.2)',
                borderColor: type === 'pie' ? 'rgba(75, 192, 192, 1)' : 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.label + ': ' + tooltipItem.raw;
                        }
                    }
                }
            }
        }
    });
}
