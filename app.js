document.addEventListener('DOMContentLoaded', function() {
    // Configuration and constants
    const IMPACT_AREAS = [
        { id: 'performance', name: 'Performance Impact', description: 'Contribution to competitive results' },
        { id: 'revenue', name: 'Revenue Generation', description: 'Impact on financial performance' },
        { id: 'brand', name: 'Brand Value', description: 'Contribution to organizational identity' },
        { id: 'knowledge', name: 'Knowledge Concentration', description: 'Possession of unique knowledge' },
        { id: 'decisions', name: 'Decision Authority', description: 'Control over critical decisions' }
    ];
    
    const RISK_LEVELS = {
        LOW: { threshold: 30, label: 'Low', class: 'low' },
        MEDIUM: { threshold: 60, label: 'Medium', class: 'medium' },
        HIGH: { threshold: 80, label: 'High', class: 'high' },
        CRITICAL: { threshold: 100, label: 'Critical', class: 'critical' }
    };
    
    // State management
    let state = {
        personnel: [],
        assessments: {},
        results: {
            overallScore: 0,
            riskDistribution: {},
            personnelScores: [],
            impactAreaScores: {}
        }
    };
    
    // DOM Elements
    const personnelContainer = document.getElementById('personnel-container');
    const addPersonnelBtn = document.getElementById('add-personnel-btn');
    const assessmentContainer = document.getElementById('assessment-container');
    const keyPersonnelForm = document.getElementById('key-personnel-form');
    const resetFormBtn = document.getElementById('reset-form-btn');
    const resultsSection = document.getElementById('results');
    const recommendationsSection = document.getElementById('recommendations');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const emailReportBtn = document.getElementById('email-report-btn');
    const sendEmailBtn = document.getElementById('send-email-btn');
    
    // Initialize the app
    init();
    
    function init() {
        // Set up event listeners
        addPersonnelBtn.addEventListener('click', addPersonnelEntry);
        resetFormBtn.addEventListener('click', resetForm);
        keyPersonnelForm.addEventListener('submit', handleFormSubmit);
        downloadPdfBtn.addEventListener('click', generatePDF);
        emailReportBtn.addEventListener('click', showEmailModal);
        sendEmailBtn.addEventListener('click', sendEmailReport);
        
        // Initialize with first personnel entry
        renderAssessmentTable();
        
        // Handle removing personnel entries (delegated event)
        personnelContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-personnel-btn')) {
                removePersonnelEntry(e.target.closest('.personnel-entry'));
            }
        });
        
        // Handle assessment rating clicks (delegated event)
        assessmentContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('impact-option')) {
                handleRatingSelection(e.target);
            }
        });
    }
    
    // Personnel Entry Management
    function addPersonnelEntry() {
        const entry = document.createElement('div');
        entry.className = 'row mb-3 personnel-entry';
        entry.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control personnel-name" placeholder="Name or Position" required>
            </div>
            <div class="col-md-5">
                <select class="form-select personnel-role">
                    <option value="">Select Role</option>
                    <option value="Player">Player</option>
                    <option value="Coach">Coach</option>
                    <option value="Executive">Executive</option>
                    <option value="Medical">Medical Staff</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-outline-danger remove-personnel-btn">Remove</button>
            </div>
        `;
        personnelContainer.appendChild(entry);
        renderAssessmentTable();
    }
    
    function removePersonnelEntry(entry) {
        // Don't remove if it's the last entry
        if (personnelContainer.querySelectorAll('.personnel-entry').length <= 1) {
            alert('You must have at least one personnel entry.');
            return;
        }
        
        entry.remove();
        renderAssessmentTable();
    }
    
    // Assessment Table Management
    function renderAssessmentTable() {
        const personnelEntries = personnelContainer.querySelectorAll('.personnel-entry');
        let tableHTML = '';
        
        if (personnelEntries.length === 0) {
            assessmentContainer.innerHTML = '<p class="text-center text-muted">Add personnel to begin assessment</p>';
            return;
        }
        
        tableHTML += `
            <table class="assessment-table">
                <thead>
                    <tr>
                        <th>Impact Area</th>
                        <th>Description</th>
                        ${Array.from(personnelEntries).map((entry, index) => {
                            const nameInput = entry.querySelector('.personnel-name');
                            return `<th class="text-center">Person ${index + 1}<br><span class="small text-muted">${nameInput.value || 'Unnamed'}</span></th>`;
                        }).join('')}
                    </tr>
                </thead>
                <tbody>
        `;
        
        IMPACT_AREAS.forEach(area => {
            tableHTML += `
                <tr>
                    <td><strong>${area.name}</strong></td>
                    <td>${area.description}</td>
                    ${Array.from(personnelEntries).map((entry, personIndex) => {
                        return `
                            <td>
                                <div class="impact-rating" data-area="${area.id}" data-person="${personIndex}">
                                    <div class="impact-option" data-value="1">1<span class="d-none d-md-inline"> - Low</span></div>
                                    <div class="impact-option" data-value="2">2</div>
                                    <div class="impact-option" data-value="3">3<span class="d-none d-md-inline"> - Med</span></div>
                                    <div class="impact-option" data-value="4">4</div>
                                    <div class="impact-option" data-value="5">5<span class="d-none d-md-inline"> - High</span></div>
                                </div>
                            </td>
                        `;
                    }).join('')}
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        assessmentContainer.innerHTML = tableHTML;
        
        // Restore any previously selected ratings
        restoreSelectedRatings();
    }
    
    function handleRatingSelection(option) {
        // Remove 'active' class from siblings
        const ratingContainer = option.closest('.impact-rating');
        ratingContainer.querySelectorAll('.impact-option').forEach(opt => {
            opt.classList.remove('active');
        });
        
        // Add 'active' class to selected option
        option.classList.add('active');
        
        // Store the selection in state
        const areaId = ratingContainer.dataset.area;
        const personIndex = ratingContainer.dataset.person;
        const value = parseInt(option.dataset.value);
        
        if (!state.assessments[personIndex]) {
            state.assessments[personIndex] = {};
        }
        state.assessments[personIndex][areaId] = value;
    }
    
    function restoreSelectedRatings() {
        // Restore any previously selected ratings from state
        for (const personIndex in state.assessments) {
            for (const areaId in state.assessments[personIndex]) {
                const value = state.assessments[personIndex][areaId];
                const ratingContainer = document.querySelector(`.impact-rating[data-area="${areaId}"][data-person="${personIndex}"]`);
                if (ratingContainer) {
                    const option = ratingContainer.querySelector(`.impact-option[data-value="${value}"]`);
                    if (option) {
                        option.classList.add('active');
                    }
                }
            }
        }
    }
    
    // Form Submission and Results Calculation
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Collect personnel data
        state.personnel = Array.from(personnelContainer.querySelectorAll('.personnel-entry')).map(entry => {
            return {
                name: entry.querySelector('.personnel-name').value,
                role: entry.querySelector('.personnel-role').value || 'Unspecified'
            };
        });
        
        // Calculate results
        calculateResults();
        
        // Display results
        displayResults();
        
        // Scroll to results section
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function validateForm() {
        // Check if all personnel have names
        const emptyNames = Array.from(personnelContainer.querySelectorAll('.personnel-name')).some(input => !input.value.trim());
        if (emptyNames) {
            alert('Please provide names for all personnel.');
            return false;
        }
        
        // Check if all impact areas have been rated for all personnel
        const personnelCount = personnelContainer.querySelectorAll('.personnel-entry').length;
        for (let i = 0; i < personnelCount; i++) {
            for (const area of IMPACT_AREAS) {
                if (!state.assessments[i] || state.assessments[i][area.id] === undefined) {
                    alert(`Please rate all impact areas for all personnel.`);
                    return false;
                }
            }
        }
        
        return true;
    }
    
    function calculateResults() {
        // Calculate individual scores for each person
        state.results.personnelScores = state.personnel.map((person, index) => {
            let totalScore = 0;
            IMPACT_AREAS.forEach(area => {
                totalScore += state.assessments[index][area.id];
            });
            
            // Normalize to 0-100 scale
            const normalizedScore = (totalScore / (IMPACT_AREAS.length * 5)) * 100;
            
            // Determine risk level
            let riskLevel;
            if (normalizedScore < RISK_LEVELS.LOW.threshold) {
                riskLevel = RISK_LEVELS.LOW;
            } else if (normalizedScore < RISK_LEVELS.MEDIUM.threshold) {
                riskLevel = RISK_LEVELS.MEDIUM;
            } else if (normalizedScore < RISK_LEVELS.HIGH.threshold) {
                riskLevel = RISK_LEVELS.HIGH;
            } else {
                riskLevel = RISK_LEVELS.CRITICAL;
            }
            
            return {
                person,
                rawScore: totalScore,
                normalizedScore,
                riskLevel
            };
        });
        
        // Calculate overall dependency score (weighted average, more weight to higher scores)
        const weightedScores = state.results.personnelScores.map(score => score.normalizedScore * score.normalizedScore);
        state.results.overallScore = Math.round(Math.sqrt(weightedScores.reduce((sum, score) => sum + score, 0) / state.results.personnelScores.length));
        
        // Calculate risk distribution
        state.results.riskDistribution = {
            low: state.results.personnelScores.filter(s => s.riskLevel === RISK_LEVELS.LOW).length,
            medium: state.results.personnelScores.filter(s => s.riskLevel === RISK_LEVELS.MEDIUM).length,
            high: state.results.personnelScores.filter(s => s.riskLevel === RISK_LEVELS.HIGH).length,
            critical: state.results.personnelScores.filter(s => s.riskLevel === RISK_LEVELS.CRITICAL).length
        };
        
        // Calculate impact area scores
        state.results.impactAreaScores = {};
        IMPACT_AREAS.forEach(area => {
            let totalScore = 0;
            for (let i = 0; i < state.personnel.length; i++) {
                totalScore += state.assessments[i][area.id];
            }
            state.results.impactAreaScores[area.id] = {
                area,
                score: totalScore,
                averageScore: totalScore / state.personnel.length
            };
        });
    }
    
    function displayResults() {
        // Show results section
        resultsSection.classList.remove('d-none');
        recommendationsSection.classList.remove('d-none');
        
        // Display overall score
        const overallScore = document.getElementById('overall-score');
        overallScore.textContent = state.results.overallScore;
        
        // Set overall rating
        const overallRating = document.getElementById('overall-rating');
        let ratingText, ratingClass;
        
        if (state.results.overallScore < RISK_LEVELS.LOW.threshold) {
            ratingText = 'Balanced';
            ratingClass = 'bg-success';
        } else if (state.results.overallScore < RISK_LEVELS.MEDIUM.threshold) {
            ratingText = 'Moderate Dependency';
            ratingClass = 'bg-info';
        } else if (state.results.overallScore < RISK_LEVELS.HIGH.threshold) {
            ratingText = 'High Dependency';
            ratingClass = 'bg-warning';
        } else {
            ratingText = 'Critical Dependency';
            ratingClass = 'bg-danger';
        }
        
        overallRating.textContent = ratingText;
        overallRating.className = `badge ${ratingClass} mt-2 p-2`;
        
        // Set overall summary
        const overallSummary = document.getElementById('overall-summary');
        if (state.results.overallScore < RISK_LEVELS.LOW.threshold) {
            overallSummary.textContent = 'Your organization shows good balance between key personnel dependency and distributed responsibility.';
        } else if (state.results.overallScore < RISK_LEVELS.MEDIUM.threshold) {
            overallSummary.textContent = 'Your organization has moderate dependency on key personnel, with some potential vulnerability.';
        } else if (state.results.overallScore < RISK_LEVELS.HIGH.threshold) {
            overallSummary.textContent = 'Your organization has significant dependency on key personnel, creating organizational vulnerability.';
        } else {
            overallSummary.textContent = 'Your organization has critical dependency on key personnel, posing severe risk to operational continuity.';
        }
        
        // Populate dependency table
        const dependencyTableBody = document.getElementById('dependency-table-body');
        dependencyTableBody.innerHTML = '';
        
        // Sort personnel by dependency score (highest first)
        const sortedScores = [...state.results.personnelScores].sort((a, b) => b.normalizedScore - a.normalizedScore);
        
        sortedScores.forEach(score => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${score.person.name}</td>
                <td>${score.person.role}</td>
                <td>${Math.round(score.normalizedScore)}</td>
                <td><span class="risk-badge ${score.riskLevel.class}">${score.riskLevel.label}</span></td>
            `;
            dependencyTableBody.appendChild(row);
        });
        
        // Create risk distribution chart
        createRiskDistributionChart();
        
        // Create impact areas chart
        createImpactAreasChart();
        
        // Generate recommendations
        generateRecommendations();
        
        // Generate resilience plan
        generateResiliencePlan();
    }
    
    // Chart Creation
    function createRiskDistributionChart() {
        const ctx = document.getElementById('risk-distribution-chart').getContext('2d');
        
        // Destroy any existing chart
        if (window.riskDistChart) {
            window.riskDistChart.destroy();
        }
        
        window.riskDistChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
                datasets: [{
                    data: [
                        state.results.riskDistribution.low,
                        state.results.riskDistribution.medium,
                        state.results.riskDistribution.high,
                        state.results.riskDistribution.critical
                    ],
                    backgroundColor: [
                        '#198754', // success
                        '#ffc107', // warning
                        '#fd7e14', // orange
                        '#dc3545'  // danger
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Personnel Risk Distribution'
                    }
                }
            }
        });
    }
    
    function createImpactAreasChart() {
        const ctx = document.getElementById('impact-areas-chart').getContext('2d');
        
        // Destroy any existing chart
        if (window.impactAreasChart) {
            window.impactAreasChart.destroy();
        }
        
        const areaLabels = IMPACT_AREAS.map(area => area.name);
        const areaScores = IMPACT_AREAS.map(area => 
            Math.round((state.results.impactAreaScores[area.id].averageScore / 5) * 100)
        );
        
        window.impactAreasChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: areaLabels,
                datasets: [{
                    label: 'Dependency Score',
                    data: areaScores,
                    backgroundColor: '#0d6efd',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Dependency Level (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Impact Area'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Recommendations Generation
    function generateRecommendations() {
        const recommendationsContainer = document.getElementById('recommendations-container');
        recommendationsContainer.innerHTML = '';
        
        // Get high and critical risk personnel
        const highRiskPersonnel = state.results.personnelScores.filter(
            score => score.riskLevel === RISK_LEVELS.HIGH || score.riskLevel === RISK_LEVELS.CRITICAL
        );
        
        // Get most impacted areas
        const sortedAreas = [...Object.values(state.results.impactAreaScores)]
            .sort((a, b) => b.averageScore - a.averageScore);
        
        // Generate recommendations based on results
        if (highRiskPersonnel.length > 0) {
            // Critical dependency recommendations
            highRiskPersonnel.slice(0, 2).forEach(score => {
                const recommendation = document.createElement('div');
                recommendation.className = `recommendation-item ${score.riskLevel.class}`;
                recommendation.innerHTML = `
                    <h5><i class="bi bi-exclamation-triangle me-2"></i>Address Critical Dependency: ${score.person.name}</h5>
                    <p>This ${score.person.role} represents a ${score.riskLevel.label.toLowerCase()} dependency risk (${Math.round(score.normalizedScore)}%). 
                    Develop a succession plan and begin knowledge transfer immediately.</p>
                `;
                recommendationsContainer.appendChild(recommendation);
            });
        }
        
        // Highest impact area recommendation
        if (sortedAreas.length > 0) {
            const topArea = sortedAreas[0];
            const recommendation = document.createElement('div');
            recommendation.className = 'recommendation-item medium';
            recommendation.innerHTML = `
                <h5><i class="bi bi-diagram-3 me-2"></i>Distribute ${topArea.area.name} Responsibility</h5>
                <p>This is your highest dependency area. Consider restructuring to distribute ${topArea.area.name.toLowerCase()} 
                responsibilities across multiple roles or teams.</p>
            `;
            recommendationsContainer.appendChild(recommendation);
        }
        
        // General recommendations based on overall score
        const generalRec = document.createElement('div');
        generalRec.className = 'recommendation-item low';
        
        if (state.results.overallScore < RISK_LEVELS.LOW.threshold) {
            generalRec.innerHTML = `
                <h5><i class="bi bi-check-circle me-2"></i>Maintain Current Resilience</h5>
                <p>Your organization has good resilience. Continue current practices and consider documenting your 
                approach to maintain this balance as the organization evolves.</p>
            `;
        } else if (state.results.overallScore < RISK_LEVELS.MEDIUM.threshold) {
            generalRec.innerHTML = `
                <h5><i class="bi bi-shield-check me-2"></i>Implement Resilience Monitoring</h5>
                <p>While dependency levels are moderate, establish quarterly resilience reviews to prevent 
                drift toward higher dependency as your organization changes.</p>
            `;
        } else {
            generalRec.innerHTML = `
                <h5><i class="bi bi-gear me-2"></i>Develop Comprehensive Resilience Strategy</h5>
                <p>Your organization needs a formal resilience strategy. Consider engaging leadership in a 
                strategic planning session focused specifically on reducing key person dependencies.</p>
            `;
        }
        
        recommendationsContainer.appendChild(generalRec);
    }
    
    function generateResiliencePlan() {
        const resiliencePlanContainer = document.getElementById('resilience-plan-container');
        resiliencePlanContainer.innerHTML = '';
        
        // Short-term actions section
        const shortTerm = document.createElement('div');
        shortTerm.className = 'plan-section';
        shortTerm.innerHTML = `
            <h5>Short-Term Actions (0-3 months)</h5>
        `;
        
        // Generate 2-3 short term actions based on results
        const shortTermActions = [];
        
        // If high dependency in knowledge
        if (state.results.impactAreaScores.knowledge.averageScore > 3.5) {
            shortTermActions.push(`
                <div class="plan-action">
                    <div class="plan-action-icon"><i class="bi bi-journal-text"></i></div>
                    <div>
                        <strong>Initiate knowledge documentation program</strong>
                        <p>Begin systematically documenting critical processes and information held by key personnel.</p>
                        <div class="plan-timeline">Timeline: Immediate start, 2-month completion</div>
                    </div>
                </div>
            `);
        }
        
        // If high dependency overall
        if (state.results.overallScore > RISK_LEVELS.MEDIUM.threshold) {
            shortTermActions.push(`
                <div class="plan-action">
                    <div class="plan-action-icon"><i class="bi bi-people"></i></div>
                    <div>
                        <strong>Conduct emergency response simulation</strong>
                        <p>Run scenario planning exercises for unexpected absence of key personnel identified in this assessment.</p>
                        <div class="plan-timeline">Timeline: Within 1 month</div>
                    </div>
                </div>
            `);
        }
        
        // Always include this action
        shortTermActions.push(`
            <div class="plan-action">
                <div class="plan-action-icon"><i class="bi bi-card-checklist"></i></div>
                <div>
                    <strong>Create comprehensive dependency inventory</strong>
                    <p>Document all critical systems, passwords, relationships, and processes that depend on key personnel.</p>
                    <div class="plan-timeline">Timeline: Complete within 3 months</div>
                </div>
            </div>
        `);
        
        shortTerm.innerHTML += shortTermActions.join('');
        resiliencePlanContainer.appendChild(shortTerm);
        
        // Medium-term actions section
        const mediumTerm = document.createElement('div');
        mediumTerm.className = 'plan-section';
        mediumTerm.innerHTML = `
            <h5>Medium-Term Actions (3-12 months)</h5>
        `;
        
        // Generate 2-3 medium term actions based on results
        const mediumTermActions = [];
        
        // If high dependency in decision making
        if (state.results.impactAreaScores.decisions.averageScore > 3) {
            mediumTermActions.push(`
                <div class="plan-action">
                    <div class="plan-action-icon"><i class="bi bi-diagram-2"></i></div>
                    <div>
                        <strong>Redesign decision-making structures</strong>
                        <p>Implement committee or shared decision models for areas currently dominated by key individuals.</p>
                        <div class="plan-timeline">Timeline: Design within 3 months, implement within 6 months</div>
                    </div>
                </div>
            `);
        }
        
        // If high dependence in performance
        if (state.results.impactAreaScores.performance.averageScore > 3.5) {
            mediumTermActions.push(`
                <div class="plan-action">
                    <div class="plan-action-icon"><i class="bi bi-bar-chart-line"></i></div>
                    <div>
                        <strong>Develop performance resilience program</strong>
                        <p>Create systems to develop depth in critical performance areas, including rotation programs and cross-training.</p>
                        <div class="plan-timeline">Timeline: Complete within 6-9 months</div>
                    </div>
                </div>
            `);
        }
        
        // Always include this action
        mediumTermActions.push(`
            <div class="plan-action">
                <div class="plan-action-icon"><i class="bi bi-mortarboard"></i></div>
                <div>
                    <strong>Establish mentorship and succession planning</strong>
                    <p>Pair high-dependency personnel with deputies/successors in formalized development relationships.</p>
                    <div class="plan-timeline">Timeline: Launch within 6 months</div>
                </div>
            </div>
        `);
        
        mediumTerm.innerHTML += mediumTermActions.join('');
        resiliencePlanContainer.appendChild(mediumTerm);
        
        // Long-term actions section
        const longTerm = document.createElement('div');
        longTerm.className = 'plan-section';
        longTerm.innerHTML = `
            <h5>Long-Term Strategy (1-3 years)</h5>
        `;
        
        // Generate 1-2 long term actions based on results
        const longTermActions = [];
        
        // If brand dependence is high
        if (state.results.impactAreaScores.brand.averageScore > 3) {
            longTermActions.push(`
                <div class="plan-action">
                    <div class="plan-action-icon"><i class="bi bi-building"></i></div>
                    <div>
                        <strong>Develop institutional brand identity</strong>
                        <p>Gradually shift brand association from key individuals to organizational identity and values.</p>
                        <div class="plan-timeline">Timeline: 1-3 year strategic initiative</div>
                    </div>
                </div>
            `);
        }
        
        // Always include this action
        longTermActions.push(`
            <div class="plan-action">
                <div class="plan-action-icon"><i class="bi bi-shield-check"></i></div>
                <div>
                    <strong>Embed resilience in organizational culture</strong>
                    <p>Make dependency risk assessment part of regular strategic planning and integrate resilience metrics into performance evaluation.</p>
                    <div class="plan-timeline">Timeline: Begin within 1 year, fully implement within 2 years</div>
                </div>
            </div>
        `);
        
        longTerm.innerHTML += longTermActions.join('');
        resiliencePlanContainer.appendChild(longTerm);
    }
    
    // Utility Functions
    function resetForm() {
        if (confirm('Are you sure you want to reset the form? All your assessment data will be lost.')) {
            // Clear state
            state = {
                personnel: [],
                assessments: {},
                results: {
                    overallScore: 0,
                    riskDistribution: {},
                    personnelScores: [],
                    impactAreaScores: {}
                }
            };
            
            // Reset DOM
            while (personnelContainer.children.length > 1) {
                personnelContainer.removeChild(personnelContainer.lastChild);
            }
            
            // Clear first personnel entry
            const firstEntry = personnelContainer.querySelector('.personnel-entry');
            if (firstEntry) {
                firstEntry.querySelector('.personnel-name').value = '';
                firstEntry.querySelector('.personnel-role').selectedIndex = 0;
            }
            
            // Rebuild assessment table
            renderAssessmentTable();
            
            // Hide results
            resultsSection.classList.add('d-none');
            recommendationsSection.classList.add('d-none');
        }
    }
    
    function generatePDF() {
        // This is a placeholder for PDF generation
        // In a real app, we'd use jsPDF to create a proper PDF
        alert('PDF generation feature would be implemented here in a production app.');
        
        // Sample implementation with jsPDF would look like:
        /* 
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Strategic Resilience Assessment Report', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Overall Dependency Score: ${state.results.overallScore}/100`, 20, 40);
        
        // Add more content...
        
        doc.save('resilience-assessment.pdf');
        */
    }
    
    function showEmailModal() {
        const emailModal = new bootstrap.Modal(document.getElementById('emailModal'));
        emailModal.show();
    }
    
    function sendEmailReport() {
        const emailModal = document.getElementById('emailModal');
        const recipientEmail = document.getElementById('recipient-email').value;
        const emailSubject = document.getElementById('email-subject').value;
        const emailMessage = document.getElementById('email-message').value;
        
        if (!recipientEmail) {
            alert('Please enter a recipient email address.');
            return;
        }
        
        // This is a placeholder for email sending
        // In a real app, we'd use an API call to send the email
        alert(`Email would be sent to: ${recipientEmail}`);
        
        // Close modal
        bootstrap.Modal.getInstance(emailModal).hide();
    }
});

// Create placeholder images folder
const createImagesFolder = () => {
    // In a real app, we'd include actual SVG graphics for the resilience visual
    // This is just a placeholder comment for this code example
    console.log('Images folder and resilience graphics would be created in a production app');
};