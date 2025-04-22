//import Hallo from "../../../model/schedule";

import { set } from 'date-fns';
import Course from '../../../domain/model/course';
import Lecturer from '../../../domain/model/lecturer';
import Schedule from '../../../domain/model/schedule';
import Student from '../../../domain/model/student';
// import scheduler from 'timers/promises';

 // given
 const startDate = set(new Date(), { hours: 8, minutes: 30 });
 const endDate = set(new Date(), { hours: 10, minutes: 30 });
 const course = new Course({
   name: 'Full-stack development',
   description: 'Learn how to develop a full-stack app',
   phase: 2,
   credits: 6,
 });

 const lecturer = new Lecturer({ name: 'Johan Pieck', expertise: 'Software development' });
 const student = new Student({ name: 'Jan Janssen', studentnumber: 'r0123456' });

test('given: valid values for schedule, when: schedule is created, then: schedule is created with those values', () => {
  // given
    /////////////
  // when
  const schedule = new Schedule({ startDate, endDate, course, lecturer, student: [student]});

  // then
  expect(schedule.startDate).toEqual(startDate);
  expect(schedule.endDate).toEqual(endDate);
  expect(schedule.course).toEqual(course);
  expect(schedule.lecturer).toEqual(lecturer);
  expect(schedule.students).toContain(student);
});

test('given: an existing schedule, when: adding a student to schedule, then: student is registered for schedule', () => {
    //given
    const student2 = new Student({ name: 'Frans Franssen', studentnumber: 'r023456789' });
    const schedule = new Schedule({ startDate, endDate, course, lecturer, students: [student] });
    
    //when
    schedule.addStudentToSchedule(student2);
    
    //then
    expect(schedule.students).toContain(student);
    expect(schedule.students).toContain(student2);
});

