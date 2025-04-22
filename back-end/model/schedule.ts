import { Course } from './course';
import { Lecturer } from './lecturer';
import { Student } from './student';

export class Schedule {
    readonly startDate: Date;
    readonly endDate: Date;
    readonly course: Course;
    readonly lecturer: Lecturer;
    readonly students: Student[];

    constructor(schedule: {
        startDate: Date;
        endDate: Date;
        course: Course;
        lecturer: Lecturer;
        students: Student[];
    }) {
        this.startDate = schedule.startDate;
        this.endDate = schedule.endDate;
        this.course = schedule.course;
        this.lecturer = schedule.lecturer;
        this.students = schedule.students;
    }

    addStudentToSchedule(student2: Student) {
        this.students.push(student2)
    }
}


