import { LightningElement, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import MOMENT from '@salesforce/resourceUrl/moment';
export default class YearSelection extends LightningElement {

    @track years = [];
    @track selectedYear = new Date().getFullYear();
    @track selectedYearLabel = this.selectedYear.toString();
       moment;
    @track selectedMonth = new Date().getMonth();  // Numeric month (0-11)
    @track selectedMonthLabel = '';    
    @track isCalender =  false;
    @track selectedDates = new Set();
    @track calendarWeeks = [];

    openCalender(){
        this.isCalender = true;
        // setTimeout(() => {
        //    this.initalRender();
        // }, 1000);
       
    }

    closeModal(){
        this.isCalender = false;
    }


    @track monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    connectedCallback() {
        this.generateYears();
        this.updateMonth();

        const today = new Date();
        const currentYear = today.getFullYear();
        this.selectedYearLabel = currentYear.toString();
        if (!this.momentLoaded) {
            loadScript(this, MOMENT)
                .then(() => {
                    this.momentLoaded = true;
                    this.moment = window.moment;
                    console.log('Moment.js loaded successfully');
                    // Optionally re-initialize calendar here if needed
                     this.initializeCalendar(this.selectedYear, this.selectedMonth);
                     this.calenderMethod();
                    })
                    .catch(error => {
                        console.error('Error loading Moment.js:', error);
                        console.error('Error loading Moment.js:', error);
                    });
        }
    }

    updateMonth() {
        this.selectedMonthLabel = this.monthNames[this.selectedMonth];
    }

    handleNextMonth() {
        this.selectedMonth = (this.selectedMonth + 1) % 12;
        if (this.selectedMonth === 0) { // Wrapped from Dec to Jan
            this.selectedYear += 1;
        }
        this.updateMonth();
        this.initializeCalendar(this.selectedYear, this.selectedMonth);
        this.calenderMethod();
    }

    calenderMethod(){
        const today = moment().startOf('day');

        this.calendarWeeks.forEach(week => {
            week.days.forEach(day => {
                const isToday = moment(day.fullDate).isSame(today, 'day');
                const isSelected = this.selectedDates?.has(day.fullDate);

                // Start with base class
                let cssClass = 'calendar-date-circle';

                // Append conditionally
                if (isSelected) {
                    cssClass += ' selected-date';
                }

                if (isToday) {
                    cssClass += ' today';
                }

                day.cssClass = cssClass;
            });
        });

        this.calendarWeeks = [...this.calendarWeeks]; // Triggers re-render
    }

    handlePrevMonth() {
        this.selectedMonth--;
        if (this.selectedMonth < 0) { // Wrapped from Jan to Dec
            this.selectedMonth = 11;
            this.selectedYear -= 1;
        }
        this.updateMonth();
        this.initializeCalendar(this.selectedYear, this.selectedMonth);
        this.calenderMethod();
    }

    handleOptionClick(event) {
        const selectedValue = event.currentTarget.dataset.value;

        this.years = this.years.map(year => ({
            ...year,
            isSelected: year.value === selectedValue
        }));

        const selectedYear = this.years.find(y => y.value === selectedValue);
        this.selectedYear = parseInt(selectedValue, 10);
        this.selectedYearLabel = selectedYear?.label || 'Select a year';

        this.initializeCalendar(this.selectedYear, this.selectedMonth);
        this.calenderMethod();
    }

    generateYears() {
        const currentYear = new Date().getFullYear();
        const years = [];

        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            years.push({ label: i.toString(), value: i.toString(), isSelected: false });
        }

        this.years = years;
        console.log('OUTPUT :years ',this.years);
    }

    handleYearClick() {
        let filterInputToggle = this.template.querySelector('.yearOpen').classList.toggle('slds-is-open');
          
         this.isDropdownOpen = true;
    }




    updateYearSelection(newYear) {
        this.years = this.years.map(year => ({
            ...year,
            isSelected: year.value === newYear.toString()
        }));

        this.selectedYear = newYear;
        this.selectedYearLabel = newYear.toString();
    }

     initializeCalendar(year, month) {
        const moment = this.moment;

        console.log('OUTPUT : year', year);
        console.log('OUTPUT : month', month);

        // Define the start and end of the given month and year
        const startOfMonth = moment([year, month]).startOf('month');
        const endOfMonth = moment([year, month]).endOf('month');

        // Calculate the full calendar range:
        const startDate = startOfMonth.clone().startOf('week'); // e.g. Monday start
        const endDate = endOfMonth.clone().endOf('week');       // e.g. Sunday end

        const days = [];
        const today = moment();          // Today’s actual date

        const selectedMonth = month;     

        const date = startDate.clone();

        while (date.isSameOrBefore(endDate)) {
            // Check if the date belongs to the selected calendar month
            const isCurrentMonth = date.month() === selectedMonth;

            // Check if the date is today (system's actual date)
            const isToday = date.isSame(today, 'day');

            // Set CSS classes accordingly
            let cssClass = isCurrentMonth ? 'current-month' : 'other-month';

            if (isToday) {
                cssClass += ' today';
            } else {
                cssClass += ' not-today';
            }

            // Add this day to the days array
            days.push({
                date: date.date(),                   // Day number (1 to 31)
                fullDate: date.format('YYYY-MM-DD'),// Full date string
                cssClass
            });

            // Move to next day
            date.add(1, 'day');
        }

        // Group days into weeks of 7 days each
        const weeks = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push({
                id: 'week-' + i,
                days: days.slice(i, i + 7)
            });
        }

        // Save weeks to tracked property to render in UI
        this.calendarWeeks = weeks;
    }

    @track isDateCount = 0;
    handleDateClick(event){
        const clickedDate = event.currentTarget.dataset.date;
        console.log('OUTPUT : clickedDate',clickedDate);
        if (this.selectedDates.has(clickedDate)) {
            this.selectedDates.delete(clickedDate); // Deselect
        } else {
            this.selectedDates.add(clickedDate); // Select
            console.log('OUTPUT :selectedDates Else ',this.selectedDates);
        }

         this.selectedDates = new Set(this.selectedDates);
         console.log('OUTPUT :selectedDates ',this.selectedDates);
         if(this.selectedDates.size > 0){
            this.isDateCount = this.selectedDates.size;
            this.formatAllDates(this.selectedDates);
         }
        // this.updateDayClasses();
        this.updateDayClasses();
    }

    updateDayClasses() {
        this.calendarWeeks.forEach(week => {
            week.days.forEach(day => {
                day.cssClass = 'calendar-date-circle';
                if (this.selectedDates.has(day.fullDate)) {
                    day.cssClass += ' selected-date';
                }
            });
        });
        this.calendarWeeks = [...this.calendarWeeks];
    }


    @track formattedDates = [];



    formatAllDates(selectedDates) {
        this.formattedDates = []; // clear first
        selectedDates.forEach(dateStr => {
            const label = this.formatDate(dateStr);
            this.formattedDates.push({ label: label, value: dateStr });
            console.log('OUTPUT : formattedDates',this.formattedDates);
            if(this.formattedDates.length > 0){
                console.log('OUTPUT :formattedDates',this.formattedDates);
                this.dates = [...this.formattedDates];
            }
        });
    }

    formatDate(dateStr) {
            const date = new Date(dateStr);
            
            const options = { weekday: 'long', day: 'numeric', year: 'numeric' };
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const parts = formatter.formatToParts(date);

            const weekday = parts.find(p => p.type === 'weekday').value;
            const day = parts.find(p => p.type === 'day').value;
            const year = parts.find(p => p.type === 'year').value;

            return `${weekday} ${day}, ${year}`;
    }

    @track dateValue;
    @track dates = [];

    handleChange(event) {
        this.dateValue = event.detail.value;
    }

}