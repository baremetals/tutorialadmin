'use strict';

/**
 *  student controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController("api::student.student", ({ strapi }) => ({
  /**
   *  This function is join a course.
   * It first checks if the user is a student, if so it checks the have already registered for the course.
   * If they have registered an error is return else it registers the users for the course.
   * 
   * If the user is not already registered as a student, then it first registers them as a studen then registers 
   * them for the course.
   */
  async create(ctx) {
    const { data } = ctx.request.body;
    // const { query } = ctx;
    const { slug, user, course } = data;

    // const id = user;

    // if (!query.filters) query.filters = {};
    // query.filters.slug = { $eq: slug };
    // console.log(query);

    // finds the course to be joined.
    const courseEntity = await strapi
      .service("api::course.course")
      .findOne(course, {
        fields: ["totalStudents"],
        populate: { students: true },
      });


    // Checks if the user is already registered as a student.
    const existingEntity = await strapi.service("api::student.student").find({
      filters: { slug: { $eq: slug } },
      populate: { courses: true },
    });
    const newStudent = existingEntity.results[0];


    if (newStudent !== undefined) {
      try {
        // Filters students of the course to see if the user is already registered for that course.
        const result = courseEntity.students.find(
          ({ id }) => id === newStudent.id
        );

        if (!result) {
          //   console.log(result.id);
          const res = await strapi
            .service("api::course.course")
            .update(course, {
              data: {
                students: courseEntity.students.concat(newStudent.id),
                totalStudents: courseEntity.totalStudents + 1,
              },
            });
          const resp = await strapi
            .service("api::student.student")
            .update(newStudent.id, {
              data: {
                courses: newStudent.courses.concat(course),
              },
            });
          return {
            data: {
              newStudent,
              updated: {
                course: res,
                student: resp,
              },
            },
          };
        } else {
          return this.transformResponse({
            error: {
              msg: "You have already registered for this course",
            },
          })
          
        }
      } catch (err) {
        console.error(err)
      }
    } else {
      try {
        
        // This else function registers the user as a student, then registers them for the course.
        const createStudent = await strapi
          .service("api::student.student")
          .create({
            data: {
              joined: true,
              slug,
              course: course,
              user,
              publishedAt: Date.now(),
            },
          });
        console.log(createStudent);
        const res = await strapi.service("api::course.course").update(course, {
          data: {
            students: courseEntity.students.concat(createStudent.id),
            totalStudents: courseEntity.totalStudents + 1,
          },
        });

        const resp = await strapi
          .service("api::student.student")
          .update(createStudent.id, {
            data: {
              courses: [course],
            },
          });
        return {
          data: {
            newstudent: createStudent,
            updated: {
              course: res,
              student: resp,
            },
          },
        };
      } catch (err) {
        return err;
      }
    }
  },
}));
