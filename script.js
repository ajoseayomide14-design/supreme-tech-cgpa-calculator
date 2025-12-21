//let's start what we've come into the room to do

let isScoreCalculated = false;

document.addEventListener('DOMContentLoaded', () => {
    
    //front page loic
    const startBtn = document.getElementById('startBtn');
    const calculatorSection = document.getElementById('calculator-section');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            calculatorSection.scrollIntoView({ 
                behavior: 'smooth' 
            });
        });
    }


    //toggle that thing
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    let currentScale = 5; 

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
        
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentScale = parseInt(btn.getAttribute('data-value'));
            
            const cgpaInput = document.getElementById('currentCgpa');
            if(cgpaInput) cgpaInput.value = '';

            const allGradeInputs = document.querySelectorAll('.grade-input');
            allGradeInputs.forEach(input => {
                input.value = '';
            });

            updateAllPlaceholders();

            console.log("Scale switched & inputs cleared."); 
        });
    });


    const cgpaInput = document.getElementById('currentCgpa');

    if (cgpaInput) {
        cgpaInput.addEventListener('input', function() {
            if (this.value.length > 4) {
                this.value = this.value.slice(0, 4); 
            }
        });
    }


    //course rows
    const courseListContainer = document.getElementById('courseListContainer');
    const addCourseBtn = document.getElementById('addCourseBtn');
    
//create a new row
    function addCourseRow() {
        const row = document.createElement('div');
        row.classList.add('course-row');

//dynamic html row
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

//delete row
        const deleteBtn = row.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            row.remove();
        });

        courseListContainer.appendChild(row);
    }


    //lock "download result"
    function lockDownloadResult() {
        isScoreCalculated = false;
    }

//watch dashboard inputs
    const dashboardInputs = [document.getElementById('currentCgpa'), document.getElementById('totalUnits')];
    dashboardInputs.forEach(input => {
        if(input) {
            input.addEventListener('input', lockDownloadResult);
        }
    });

//watch course inputs
    if (courseListContainer) {
        courseListContainer.addEventListener('input', function(e) {

            if (e.target.type === 'text') return;

            if (e.target.type === 'number' || e.target.tagName === 'SELECT') {
                lockDownloadResult();
            }
        });
        
//watch delete row
        courseListContainer.addEventListener('click', function(e) {
            if (e.target.closest('.delete-btn')) {
                lockDownloadResult();
            }
        });
    }

//watch add row
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', lockDownloadResult);
    }

//watch toggle
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', lockDownloadResult);
    });


    // add one row immediately page loads
    if (courseListContainer) {
        addCourseRow();
    }


    //"add course" click
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', addCourseRow);
    }


    //calculation
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

            const currentCgpaInput = document.getElementById('currentCgpa');
            const totalUnitsInput = document.getElementById('totalUnits');
            const dashboardError = document.getElementById('dashboardError');

            currentCgpaInput.classList.remove('input-error');
            totalUnitsInput.classList.remove('input-error');
            dashboardError.classList.remove('show');
            dashboardError.innerText = "No valid input given";

            if (!currentCgpaInput.value || !totalUnitsInput.value) {
                if(!currentCgpaInput.value) currentCgpaInput.classList.add('input-error');
                if(!totalUnitsInput.value) totalUnitsInput.classList.add('input-error');
                dashboardError.classList.add('show'); 
                hasError = true;
            } 
            else if (parseFloat(currentCgpaInput.value) > currentScale) {
                currentCgpaInput.classList.add('input-error');
                dashboardError.innerText = `CGPA cannot exceed ${currentScale}.0`;
                dashboardError.classList.add('show');
                hasError = true;
            }

            document.querySelectorAll('.course-input').forEach(i => i.classList.remove('input-error'));

            rows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                const unitsVal = parseFloat(inputs[1].value); 
                const gradeRaw = inputs[2].value.toUpperCase(); 

                if (!inputs[1].value || !inputs[2].value) {
                    if(!inputs[1].value) inputs[1].classList.add('input-error');
                    if(!inputs[2].value) inputs[2].classList.add('input-error');
                    hasError = true;
                    return;
                }

                let point = getGradePoint(gradeRaw, currentScale);

                if (point === -1) {
                    inputs[2].classList.add('input-error');
                    hasError = true;
                } else {
                    totalSemUnits += unitsVal;
                    totalSemPoints += (point * unitsVal);
                }
            });

            if (hasError) {
                setTimeout(() => {
                    document.querySelectorAll('.input-error').forEach(i => i.classList.remove('input-error'));

                    if(dashboardError) dashboardError.classList.remove('show');
                }, 3000);
                
                return;
            }

            const btnText = calculateBtn.querySelector('.btn-text');
            const loader = calculateBtn.querySelector('.loader-dots');

            btnText.style.display = 'none';
            loader.style.display = 'flex';


            setTimeout(() => {

                const semesterGpa = totalSemUnits === 0 ? 0 : (totalSemPoints / totalSemUnits);
                
                const prevCgpa = parseFloat(currentCgpaInput.value) || 0;
                const prevUnits = parseFloat(totalUnitsInput.value) || 0;

                const totalAllUnits = prevUnits + totalSemUnits;
                const totalAllPoints = (prevCgpa * prevUnits) + totalSemPoints;
                
                const finalCgpa = totalAllUnits === 0 ? 0 : (totalAllPoints / totalAllUnits);

                if(resultGpa) resultGpa.innerText = semesterGpa.toFixed(2);
                if(resultCgpa) resultCgpa.innerText = finalCgpa.toFixed(2);
                if(resultClass) resultClass.innerText = getClassOfDegree(finalCgpa, currentScale);

                isScoreCalculated = true;

            if(dashboardError) dashboardError.classList.remove('show');
            

                loader.style.display = 'none';
                btnText.style.display = 'block';

// smooth scroll to result
                const summaryCard = document.querySelector('.summary-card');
                if (summaryCard) summaryCard.scrollIntoView({ behavior: 'smooth' });

            }, 1000);
        });
    }



    function getGradePoint(grade, scale) {
        const g = grade.toUpperCase();
        
        //5.0 scale
        if (scale === 5) {
            if (g === 'A' || g === '5') return 5;
            if (g === 'B' || g === '4') return 4;
            if (g === 'C' || g === '3') return 3;
            if (g === 'D' || g === '2') return 2;
            if (g === 'E' || g === '1') return 1;
            if (g === 'F' || g === '0') return 0;
        } 

        // 4.0 scale
        else {
            if (g === 'A' || g === '4') return 4;
            if (g === 'B' || g === '3') return 3;
            if (g === 'C' || g === '2') return 2;
            if (g === 'D' || g === '1') return 1;
            if (g === 'F' || g === '0') return 0;
        }
        return -1;
    }

        //class of degree
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

//placeholder for mobile course list
    function getGradePlaceholder(scale) {
        const isMobile = window.innerWidth <= 480;
        
        if (scale === 5) {
            return isMobile ? "A or 5" : "Grade (e.g. A or 5)";
        } else {
            return isMobile ? "A or 4" : "Grade (e.g. A or 4)";
        }
    }


    function updateAllPlaceholders() {
        const allGradeInputs = document.querySelectorAll('.grade-input');
        allGradeInputs.forEach(input => {
            input.placeholder = getGradePlaceholder(currentScale);
        });
    }

    window.addEventListener('resize', () => {
        updateAllPlaceholders();
    });


    document.addEventListener('keydown', function(event) {
        if (event.target.type === 'number') {

            if (['e', 'E', '+', '-'].includes(event.key)) {
                event.preventDefault();
            }
        }
    });


    //result - reset & download

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            
//0.3 seconds to let the "shrink" animation play, reset "places" below
            setTimeout(() => {
                
                const cgpaInput = document.getElementById('currentCgpa');
                const unitsInput = document.getElementById('totalUnits');
                if(cgpaInput) cgpaInput.value = '';
                if(unitsInput) unitsInput.value = '';

                if(resultGpa) resultGpa.innerText = '0.00';
                if(resultCgpa) resultCgpa.innerText = '0.00';
                if(resultClass) resultClass.innerText = '-';

                courseListContainer.innerHTML = ''; 
                addCourseRow(); 

//scroll to academic profile tab
                const profileSection = document.querySelector('.toggle-wrapper');
                
                if (profileSection) {
                    profileSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                isScoreCalculated = false;

            }, 300);
        });
    }



    //pdf download
    const downloadBtn = document.getElementById('downloadBtn');
    const pdfModal = document.getElementById('pdfModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            

            if (!isScoreCalculated) {
                downloadBtn.classList.add('shake-effect');
                setTimeout(() => downloadBtn.classList.remove('shake-effect'), 400);

                const feedbackMsg = document.getElementById('downloadFeedback');
                if(feedbackMsg) {
                    feedbackMsg.innerText = "Please Calculate Score.";
                    feedbackMsg.classList.add('show');

                    setTimeout(() => {
                        feedbackMsg.classList.remove('show');
                    }, 2000);
                }

                return;
            }

            const originalContent = downloadBtn.innerHTML; 
            downloadBtn.innerHTML = '<div class="loader-spinner brown-loader" style="display:block"></div>'; 
            
            setTimeout(() => {
                downloadBtn.innerHTML = originalContent; 
                pdfModal.classList.add('active'); 
            }, 800);
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            pdfModal.classList.remove('active');
        });
    }

//close when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === pdfModal) pdfModal.classList.remove('active');
    });



//chrome print
if (generatePdfBtn) {
    generatePdfBtn.addEventListener('click', () => {

        const nameInput = document.getElementById('studentName');
// get value and remove extra spaces
        const nameVal = nameInput ? nameInput.value.trim() : "";

        if (!nameVal) {
            if(nameInput) nameInput.style.border = "1px solid red";
           

            setTimeout(() => {
            if(nameInput) nameInput.style.border = "1px solid #ccc";
        }, 2000);
            return;
        } else {
            if(nameInput) nameInput.style.border = "1px solid #ccc"; 
        }

        const isScale5 = document.querySelector('.toggle-btn[data-value="5"]').classList.contains('active');
        
        const prevCgpaInput = document.getElementById('currentCgpa');
        const prevUnitsInput = document.getElementById('totalUnits');
        
        let prevCgpa = parseFloat(prevCgpaInput.value) || 0;
        let prevUnits = parseFloat(prevUnitsInput.value) || 0;
        let prevPoints = prevCgpa * prevUnits;

        let semUnits = 0;
        let semPoints = 0;
        const tableBody = document.getElementById('pdfCourseList');
        tableBody.innerHTML = ''; 

        document.querySelectorAll('.course-row').forEach(row => {
            const inputs = row.querySelectorAll('input');
            
            const code = inputs[0].value || "N/A";
            const unit = parseFloat(inputs[1].value) || 0;
            let rawGrade = inputs[2] ? inputs[2].value.trim().toUpperCase() : "-";


            
            let finalLetter = "-";
            let point = 0;

            if (isScale5) {
//5.0 scale in pdf
                if (rawGrade === 'A' || rawGrade === '5') { finalLetter = 'A'; point = 5; }
                else if (rawGrade === 'B' || rawGrade === '4') { finalLetter = 'B'; point = 4; }
                else if (rawGrade === 'C' || rawGrade === '3') { finalLetter = 'C'; point = 3; }
                else if (rawGrade === 'D' || rawGrade === '2') { finalLetter = 'D'; point = 2; }
                else if (rawGrade === 'E' || rawGrade === '1') { finalLetter = 'E'; point = 1; }
                else if (rawGrade === 'F' || rawGrade === '0') { finalLetter = 'F'; point = 0; }
                else { 

                    finalLetter = rawGrade; point = 0; 
                }
            } else {

//4.0 scale in pdf
                if (rawGrade === 'A' || rawGrade === '4') { finalLetter = 'A'; point = 4; }
                else if (rawGrade === 'B' || rawGrade === '3') { finalLetter = 'B'; point = 3; }
                else if (rawGrade === 'C' || rawGrade === '2') { finalLetter = 'C'; point = 2; }
                else if (rawGrade === 'D' || rawGrade === '1') { finalLetter = 'D'; point = 1; }
                else if (rawGrade === 'F' || rawGrade === '0') { finalLetter = 'F'; point = 0; }
                else { finalLetter = rawGrade; point = 0; }
            }

            semUnits += unit;
            semPoints += (point * unit);


            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">${code.toUpperCase()}</td>
                <td style="text-align: center;">${unit}</td>
                <td style="text-align: center;">${finalLetter} (${point})</td>
            `;
            tableBody.appendChild(tr);
        });

        const semGpa = semUnits === 0 ? 0 : (semPoints / semUnits);


        const totalUnits = prevUnits + semUnits;
        const totalPoints = prevPoints + semPoints;
        const finalCgpa = totalUnits === 0 ? 0 : (totalPoints / totalUnits);


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

        //transfer data
        const deptVal = document.getElementById('studentDept') ? document.getElementById('studentDept').value : "";
        document.getElementById('pdfName').innerText = nameVal;
        document.getElementById('pdfDept').innerText = deptVal || "N/A";

        document.getElementById('pdfDate').innerText = new Date().toLocaleString();

        document.getElementById('pdfPrevCgpa').innerText = prevCgpa.toFixed(2);
        document.getElementById('pdfPrevUnits').innerText = prevUnits;

        document.getElementById('pdfSemGpa').innerText = semGpa.toFixed(2);
        document.getElementById('pdfSemUnits').innerText = semUnits;

        document.getElementById('pdfFinalCgpa').innerText = finalCgpa.toFixed(2);
        document.getElementById('pdfTotalUnits').innerText = totalUnits;

        document.getElementById('pdfClassDegree').innerText = verdict;


        window.print();
    });
}
}); 


//omoo😔