// GLOBAL FLAG: Tracks if a valid calculation has happened
let isScoreCalculated = false;
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
            if (this.value.length > 4) {
                this.value = this.value.slice(0, 4); 
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

    // ==========================================
    // HELPER: AUTO-LOCK SYSTEM
    // ==========================================
    
    // Function to lock the download (Turn switch OFF)
    function lockDownloadResult() {
        isScoreCalculated = false;
        // Optional: You could visually dim the button here if you wanted, 
        // but we are sticking to the "Shake on Click" method.
    }

    // 1. Watch Dashboard Inputs (CGPA & Total Units)
    const dashboardInputs = [document.getElementById('currentCgpa'), document.getElementById('totalUnits')];
    dashboardInputs.forEach(input => {
        if(input) {
            input.addEventListener('input', lockDownloadResult);
        }
    });

    // 2. Watch Course Inputs (Delegation for Dynamic Rows)
    // We listen to the whole container, but filter what we care about.
    if (courseListContainer) {
        courseListContainer.addEventListener('input', function(e) {
            // IGNORE Course Names (Text inputs)
            if (e.target.type === 'text') return;

            // LOCK if it's Units (number) or Grade (select)
            if (e.target.type === 'number' || e.target.tagName === 'SELECT') {
                lockDownloadResult();
            }
        });
        
        // Also Lock if a row is Deleted
        courseListContainer.addEventListener('click', function(e) {
            if (e.target.closest('.delete-btn')) {
                lockDownloadResult();
            }
        });
    }

    // 3. Watch "Add Course" Button
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', lockDownloadResult);
    }

    // ==========================================
    // ==========================================
    // 4. NEW: Watch Grading Scale Toggle (Updated for your Buttons)
    // ==========================================
    // We select all buttons with the class "toggle-btn"
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    // Add a listener to EACH button
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', lockDownloadResult);
    });

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

                // [ADD THIS NEW LINE HERE]:
                isScoreCalculated = true; // <--- The Lock is now OPEN

                // [EXISTING CODE] ... update UI text ...
            
            // Clear any previous error messages
            if(dashboardError) dashboardError.classList.remove('show');
            

                // Stop Animation
                loader.style.display = 'none';
                btnText.style.display = 'block';

                // Smooth Scroll to Results
                const summaryCard = document.querySelector('.summary-card');
                if (summaryCard) summaryCard.scrollIntoView({ behavior: 'smooth' });

            }, 1000);  // 2000ms = 2 Seconds
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
            if (cgpa >= 4.50) return 'First Class Honours';
            if (cgpa >= 3.50) return 'Second Class Upper';
            if (cgpa >= 2.50) return 'Second Class Lower';
            if (cgpa >= 1.50) return 'Third Class';
            if (cgpa >= 1.00) return 'Pass';
            return 'Fail';
        } else {
            if (cgpa >= 3.50) return 'First Class Honours';
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

    // ==========================================
    // 6. UTILITY: BLOCK INVALID KEYS (e, E, +, -)
    // ==========================================
    // This blocks the "e" key globally for all number inputs (including new ones)
    document.addEventListener('keydown', function(event) {
        // Only run if the user is typing in a number box
        if (event.target.type === 'number') {
            // If the key is e, E, +, or - stop it instantly
            if (['e', 'E', '+', '-'].includes(event.key)) {
                event.preventDefault();
            }
        }
    });

    // ==========================================
    // 7. RESULT ACTIONS (Reset & Download)
    // ==========================================

    // --- RESET BUTTON LOGIC (With Animation Delay) ---
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            
            // Wait 300ms (0.3 seconds) to let the "Shrink" animation play
            setTimeout(() => {
                
                // 1. Clear Dashboard Inputs
                const cgpaInput = document.getElementById('currentCgpa');
                const unitsInput = document.getElementById('totalUnits');
                if(cgpaInput) cgpaInput.value = '';
                if(unitsInput) unitsInput.value = '';

                // 2. Reset Results Text
                if(resultGpa) resultGpa.innerText = '0.00';
                if(resultCgpa) resultCgpa.innerText = '0.00';
                if(resultClass) resultClass.innerText = '-';

                // 3. Clear Course List (Destroy all, create 1 fresh row)
                courseListContainer.innerHTML = ''; 
                addCourseRow(); 

                // 4. Scroll to Academic Profile (Robust Fix)
                const profileSection = document.querySelector('.toggle-wrapper');
                
                if (profileSection) {
                    profileSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                // [ADD THIS NEW LINE HERE]:
                isScoreCalculated = false; // <--- The Lock is CLOSED again

            }, 300); // <-- The code waits here for 300ms
        });
    }

            // Note: We intentionally DO NOT reset 'currentScale'. 
            // The user stays on their selected scale (5.0 or 4.0).

    // ==========================================
    // 8. PDF DOWNLOAD FLOW & MODAL LOGIC (UPDATED)
    // ==========================================

    const downloadBtn = document.getElementById('downloadBtn');
    const pdfModal = document.getElementById('pdfModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    
    // --- PART A: OPEN MODAL (With Proximity Feedback) ---
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            
            // GATEKEEPER: Check the Flag
            if (!isScoreCalculated) {
                // 1. Shake the Button
                downloadBtn.classList.add('shake-effect');
                setTimeout(() => downloadBtn.classList.remove('shake-effect'), 400);

                // 2. Show FEEDBACK (Right above the button)
                const feedbackMsg = document.getElementById('downloadFeedback');
                if(feedbackMsg) {
                    feedbackMsg.innerText = "Please Calculate Score.";
                    feedbackMsg.classList.add('show');

                    // Hide automatically after 3 seconds
                    setTimeout(() => {
                        feedbackMsg.classList.remove('show');
                    }, 2000);
                }

                return; // STOP HERE
            }

            // IF UNLOCKED: Show Brown Loader & Open Modal
            const originalContent = downloadBtn.innerHTML; 
            downloadBtn.innerHTML = '<div class="loader-spinner brown-loader" style="display:block"></div>'; 
            
            setTimeout(() => {
                downloadBtn.innerHTML = originalContent; 
                pdfModal.classList.add('active'); 
            }, 800);
        });
    }

    // --- PART B: CLOSE MODAL LOGIC ---
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            pdfModal.classList.remove('active');
        });
    }
    // Close when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === pdfModal) pdfModal.classList.remove('active');
    });

   // ==========================================
// PART C: DIRECT PRINT LOGIC (With Validation)
// ==========================================
if (generatePdfBtn) {
    generatePdfBtn.addEventListener('click', () => {
        // --- 0. VALIDATION CHECK ---
        const nameInput = document.getElementById('studentName');
        // Get value and remove extra spaces
        const nameVal = nameInput ? nameInput.value.trim() : "";

        // If name is empty, turn red and STOP.
        if (!nameVal) {
            if(nameInput) nameInput.style.border = "1px solid red";
           
           //removes border after 3secs
            setTimeout(() => {
            if(nameInput) nameInput.style.border = "1px solid #ccc";
        }, 2000);
            return; // Stops the code here. No PDF is generated.
        } else {
            // Reset border if valid
            if(nameInput) nameInput.style.border = "1px solid #ccc"; 
        }

        // --- 1. GET SETTINGS & PREVIOUS DATA ---
        const isScale5 = document.querySelector('.toggle-btn[data-value="5"]').classList.contains('active');
        
        const prevCgpaInput = document.getElementById('currentCgpa');
        const prevUnitsInput = document.getElementById('totalUnits');
        
        let prevCgpa = parseFloat(prevCgpaInput.value) || 0;
        let prevUnits = parseFloat(prevUnitsInput.value) || 0;
        let prevPoints = prevCgpa * prevUnits;

        // --- 2. CALCULATE CURRENT SEMESTER (Enhanced Input Interpreter) ---
        let semUnits = 0;
        let semPoints = 0;
        const tableBody = document.getElementById('pdfCourseList');
        tableBody.innerHTML = ''; 

        document.querySelectorAll('.course-row').forEach(row => {
            const inputs = row.querySelectorAll('input');
            
            // Get raw values
            const code = inputs[0].value || "N/A";
            const unit = parseFloat(inputs[1].value) || 0;
            let rawGrade = inputs[2] ? inputs[2].value.trim().toUpperCase() : "-";

            // --- THE NEW "INTERPRETER" LOGIC ---
            // We define what "Grade A", "Grade B", etc. looks like based on the scale.
            // Example: If Scale 5, an "A" is either "A" or "5".
            
            let finalLetter = "-"; // Default display letter
            let point = 0;         // Default point value

            if (isScale5) {
                // --- 5.0 SCALE LOGIC ---
                // Checks for Letter OR Number input
                if (rawGrade === 'A' || rawGrade === '5') { finalLetter = 'A'; point = 5; }
                else if (rawGrade === 'B' || rawGrade === '4') { finalLetter = 'B'; point = 4; }
                else if (rawGrade === 'C' || rawGrade === '3') { finalLetter = 'C'; point = 3; }
                else if (rawGrade === 'D' || rawGrade === '2') { finalLetter = 'D'; point = 2; }
                else if (rawGrade === 'E' || rawGrade === '1') { finalLetter = 'E'; point = 1; }
                else if (rawGrade === 'F' || rawGrade === '0') { finalLetter = 'F'; point = 0; }
                else { 
                    // If input is totally weird (like "Q" or "9"), keep it as is, points = 0
                    finalLetter = rawGrade; point = 0; 
                }
            } else {
                // --- 4.0 SCALE LOGIC ---
                if (rawGrade === 'A' || rawGrade === '4') { finalLetter = 'A'; point = 4; }
                else if (rawGrade === 'B' || rawGrade === '3') { finalLetter = 'B'; point = 3; }
                else if (rawGrade === 'C' || rawGrade === '2') { finalLetter = 'C'; point = 2; }
                else if (rawGrade === 'D' || rawGrade === '1') { finalLetter = 'D'; point = 1; }
                else if (rawGrade === 'F' || rawGrade === '0') { finalLetter = 'F'; point = 0; }
                else { finalLetter = rawGrade; point = 0; }
            }

            // Add to Semester Totals
            semUnits += unit;
            semPoints += (point * unit);

            // Add Row to PDF Table
            // NOW: We print 'finalLetter' (e.g., "A") and 'point' (e.g., 5)
            // Result: "A (5)" even if user typed "5"
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">${code.toUpperCase()}</td>
                <td style="text-align: center;">${unit}</td>
                <td style="text-align: center;">${finalLetter} (${point})</td>
            `;
            tableBody.appendChild(tr);
        });

        const semGpa = semUnits === 0 ? 0 : (semPoints / semUnits);


        // --- 3. CALCULATE CUMULATIVE ---
        const totalUnits = prevUnits + semUnits;
        const totalPoints = prevPoints + semPoints;
        const finalCgpa = totalUnits === 0 ? 0 : (totalPoints / totalUnits);

        // --- 4. DETERMINE CLASS OF DEGREE ---
        let verdict = "FAIL / ADVICED TO WITHDRAW";
        
        if (isScale5) {
            if (finalCgpa >= 4.50) verdict = "FIRST CLASS HONOURS";
            else if (finalCgpa >= 3.50) verdict = "SECOND CLASS UPPER";
            else if (finalCgpa >= 2.40) verdict = "SECOND CLASS LOWER";
            else if (finalCgpa >= 1.50) verdict = "THIRD CLASS";
            else if (finalCgpa >= 1.00) verdict = "PASS";
        } else {
            if (finalCgpa >= 3.50) verdict = "FIRST CLASS HONOURS";
            else if (finalCgpa >= 3.00) verdict = "SECOND CLASS UPPER";
            else if (finalCgpa >= 2.00) verdict = "SECOND CLASS LOWER";
            else if (finalCgpa >= 1.00) verdict = "THIRD CLASS";
        }

        // --- 5. TRANSFER DATA ---
        const deptVal = document.getElementById('studentDept') ? document.getElementById('studentDept').value : "";
        document.getElementById('pdfName').innerText = nameVal; // We know nameVal exists now
        document.getElementById('pdfDept').innerText = deptVal || "N/A";

        document.getElementById('pdfDate').innerText = new Date().toLocaleString();

        document.getElementById('pdfPrevCgpa').innerText = prevCgpa.toFixed(2);
        document.getElementById('pdfPrevUnits').innerText = prevUnits;

        document.getElementById('pdfSemGpa').innerText = semGpa.toFixed(2);
        document.getElementById('pdfSemUnits').innerText = semUnits;

        document.getElementById('pdfFinalCgpa').innerText = finalCgpa.toFixed(2);
        document.getElementById('pdfTotalUnits').innerText = totalUnits;

        document.getElementById('pdfClassDegree').innerText = verdict;

        // --- 6. PRINT ---
        window.print();
    });
}
}); // END OF DOMContentLoaded