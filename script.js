document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. HERO SECTION LOGIC (Scroll)
    // ==========================================
    const startBtn = document.getElementById('startBtn');
    const calculatorSection = document.getElementById('calculator-section');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            calculatorSection.scrollIntoView({ 
                behavior: 'smooth' 
            });
        });
    }

// ==========================================
    // 2. DASHBOARD TOGGLE LOGIC (Scale Selection)
    // ==========================================
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    let currentScale = 5; 

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Update UI Buttons
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 2. Update Scale Variable
            currentScale = parseInt(btn.getAttribute('data-value'));
            
            // 3. HARD RESET: Clear "Current CGPA"
            const cgpaInput = document.getElementById('currentCgpa');
            if(cgpaInput) cgpaInput.value = '';

            // 4. HARD RESET: Clear Grade Inputs & Force Update Placeholders
            const allGradeInputs = document.querySelectorAll('.grade-input');
            allGradeInputs.forEach(input => {
                input.value = ''; // Wipe the grade
            });
            
            // Update the text using our new helper function
            updateAllPlaceholders();

            console.log("Scale switched & inputs cleared."); 
        });
    });

    // ==========================================
    // 3. INPUT LIMIT LOGIC (Max 5 chars for CGPA)
    // ==========================================
    const cgpaInput = document.getElementById('currentCgpa');

    if (cgpaInput) {
        cgpaInput.addEventListener('input', function() {
            if (this.value.length > 5) {
                this.value = this.value.slice(0, 5); 
            }
        });
    }

    // ==========================================
    // 4. COURSE LIST LOGIC (Add/Remove Rows)
    // ==========================================
    const courseListContainer = document.getElementById('courseListContainer');
    const addCourseBtn = document.getElementById('addCourseBtn');
    
// Function to create a new row
    function addCourseRow() {
        const row = document.createElement('div');
        row.classList.add('course-row');

        // Dynamic HTML for the row (Pills + Delete Button)
        row.innerHTML = `
            <input type="text" class="course-input" placeholder="CSC 101" maxlength="7">
            
            <input type="number" class="course-input" placeholder="Units" inputmode="numeric">
            
            <input type="text" class="course-input grade-input" placeholder="${getGradePlaceholder(currentScale)}" maxlength="1">
            
            <button class="delete-btn" aria-label="Remove Course">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        // Logic to Delete the row when X is clicked
        const deleteBtn = row.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            row.remove();
        });

        courseListContainer.appendChild(row);
    }

    // Add one row immediately when page loads
    if (courseListContainer) {
        addCourseRow();
    }

    // Listen for "+ Add Course" click
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', addCourseRow);
    }

    // ==========================================
    // 5. CALCULATION LOGIC (The Math & Animation)
    // ==========================================
    const calculateBtn = document.getElementById('calculateBtn');
    const resultGpa = document.getElementById('resultGpa');
    const resultCgpa = document.getElementById('resultCgpa');
    const resultClass = document.getElementById('resultClass');

if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
            
            const rows = document.querySelectorAll('.course-row');
            let totalSemPoints = 0;
            let totalSemUnits = 0;
            let hasError = false;

            // --- STEP A: VALIDATE DASHBOARD INPUTS (Top Card) ---
            const currentCgpaInput = document.getElementById('currentCgpa');
            const totalUnitsInput = document.getElementById('totalUnits');
            const dashboardError = document.getElementById('dashboardError');

            // 1. Reset Dashboard Styles & Text
            currentCgpaInput.classList.remove('input-error');
            totalUnitsInput.classList.remove('input-error');
            dashboardError.classList.remove('show');
            dashboardError.innerText = "No valid input given"; // Default error text

            // 2. Check if Dashboard inputs are empty
            if (!currentCgpaInput.value || !totalUnitsInput.value) {
                if(!currentCgpaInput.value) currentCgpaInput.classList.add('input-error');
                if(!totalUnitsInput.value) totalUnitsInput.classList.add('input-error');
                dashboardError.classList.add('show'); 
                hasError = true;
            } 
            // 3. NEW: Check if CGPA exceeds the Scale (e.g. > 4.0)
            else if (parseFloat(currentCgpaInput.value) > currentScale) {
                currentCgpaInput.classList.add('input-error');
                dashboardError.innerText = `CGPA cannot exceed ${currentScale}.0`; // Specific error message
                dashboardError.classList.add('show');
                hasError = true;
            }

            // --- STEP B: VALIDATE COURSE LIST (Bottom Card) ---
            document.querySelectorAll('.course-input').forEach(i => i.classList.remove('input-error'));

            rows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                const unitsVal = parseFloat(inputs[1].value); 
                const gradeRaw = inputs[2].value.toUpperCase(); 

                // Check if empty
                if (!inputs[1].value || !inputs[2].value) {
                    if(!inputs[1].value) inputs[1].classList.add('input-error');
                    if(!inputs[2].value) inputs[2].classList.add('input-error');
                    hasError = true;
                    return;
                }

                // Convert Grade Letter to Number Points
                let point = getGradePoint(gradeRaw, currentScale);

                if (point === -1) {
                    inputs[2].classList.add('input-error'); // Invalid Grade
                    hasError = true;
                } else {
                    totalSemUnits += unitsVal;
                    totalSemPoints += (point * unitsVal);
                }
            });

            // --- STEP C: HANDLE ERRORS (3-Second Timer) ---
            if (hasError) {
                // Set a timer to clear all errors after 3 seconds
                setTimeout(() => {
                    // Remove red borders
                    document.querySelectorAll('.input-error').forEach(i => i.classList.remove('input-error'));
                    // Hide error text
                    if(dashboardError) dashboardError.classList.remove('show');
                }, 3000); // 3000ms = 3 Seconds
                
                return; // Stop calculation
            }

            // --- STEP D: START CALCULATION ANIMATION ---
            const btnText = calculateBtn.querySelector('.btn-text');
            const loader = calculateBtn.querySelector('.loader-dots');

            btnText.style.display = 'none';
            loader.style.display = 'flex';

            // Wait 2 Seconds, then Show Results
            setTimeout(() => {
                // Calculate Semester GPA
                const semesterGpa = totalSemUnits === 0 ? 0 : (totalSemPoints / totalSemUnits);
                
                // Calculate Cumulative CGPA
                const prevCgpa = parseFloat(currentCgpaInput.value) || 0;
                const prevUnits = parseFloat(totalUnitsInput.value) || 0;

                const totalAllUnits = prevUnits + totalSemUnits;
                const totalAllPoints = (prevCgpa * prevUnits) + totalSemPoints;
                
                const finalCgpa = totalAllUnits === 0 ? 0 : (totalAllPoints / totalAllUnits);

                // Update the Summary Card UI
                if(resultGpa) resultGpa.innerText = semesterGpa.toFixed(2);
                if(resultCgpa) resultCgpa.innerText = finalCgpa.toFixed(2);
                if(resultClass) resultClass.innerText = getClassOfDegree(finalCgpa, currentScale);

                // Stop Animation
                loader.style.display = 'none';
                btnText.style.display = 'block';

                // Smooth Scroll to Results
                const summaryCard = document.querySelector('.summary-card');
                if (summaryCard) summaryCard.scrollIntoView({ behavior: 'smooth' });

            }, 2000);  // 2000ms = 2 Seconds
        });
    }

    // --- HELPER FUNCTION: Get Points from Grade ---
    function getGradePoint(grade, scale) {
        const g = grade.toUpperCase();
        
        // 5.0 Scale Logic
        if (scale === 5) {
            if (g === 'A' || g === '5') return 5;
            if (g === 'B' || g === '4') return 4;
            if (g === 'C' || g === '3') return 3;
            if (g === 'D' || g === '2') return 2;
            if (g === 'E' || g === '1') return 1;
            if (g === 'F' || g === '0') return 0;
        } 
        // 4.0 Scale Logic (No E)
        else {
            if (g === 'A' || g === '4') return 4;
            if (g === 'B' || g === '3') return 3;
            if (g === 'C' || g === '2') return 2;
            if (g === 'D' || g === '1') return 1;
            if (g === 'F' || g === '0') return 0;
        }
        return -1; // Return -1 if input is invalid (like 'Z' or '7')
    }

    // --- HELPER FUNCTION: Class of Degree ---
    function getClassOfDegree(cgpa, scale) {
        if (scale === 5) {
            if (cgpa >= 4.50) return 'First Class';
            if (cgpa >= 3.50) return 'Second Class Upper';
            if (cgpa >= 2.50) return 'Second Class Lower';
            if (cgpa >= 1.50) return 'Third Class';
            if (cgpa >= 1.00) return 'Pass';
            return 'Fail';
        } else {
            if (cgpa >= 3.50) return 'First Class';
            if (cgpa >= 3.00) return 'Second Class Upper';
            if (cgpa >= 2.00) return 'Second Class Lower';
            if (cgpa >= 1.00) return 'Third Class';
            return 'Fail';
        }
    }

    // --- HELPER: Get Dynamic Placeholder Text ---
    function getGradePlaceholder(scale) {
        // Check if mobile (screen width <= 480px)
        const isMobile = window.innerWidth <= 480;
        
        if (scale === 5) {
            return isMobile ? "A or 5" : "Grade (e.g. A or 5)";
        } else {
            return isMobile ? "A or 4" : "Grade (e.g. A or 4)";
        }
    }

    // --- HELPER: Update All Existing Inputs ---
    function updateAllPlaceholders() {
        const allGradeInputs = document.querySelectorAll('.grade-input');
        allGradeInputs.forEach(input => {
            input.placeholder = getGradePlaceholder(currentScale);
        });
    }

    // --- EVENT: Listen for Screen Resize ---
    window.addEventListener('resize', () => {
        updateAllPlaceholders();
    });

}); // END OF DOMContentLoaded