/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [{
            width: 1024,
            suffix: '_small_3x',
            quality: 30
          },
          {
            width: 512,
            suffix: '_small_2x',
            quality: 30
          },
          {
            width: 256,
            suffix: '_small_1x',
            quality: 30
          },
          {
            width: 2048,
            suffix: '_medium_3x',
            quality: 30
          },
          {
            width: 1024,
            suffix: '_medium_2x',
            quality: 30
          },
          {
            width: 512,
            suffix: '_medium_1x',
            quality: 30
          },
          {
            width: 4096,
            suffix: '_large_3x',
            quality: 30
          },
          {
            width: 2048,
            suffix: '_large_2x',
            quality: 30
          },
          {
            width: 1024,
            suffix: '_large_1x',
            quality: 30
          }]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img_src/',
          dest: 'img/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['img'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['img']
        },
      },
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          cwd: 'img_src/fixed/',
          src: ['*.{gif,jpg,png,svg}'],
          dest: 'img/'
        }]
      },
    },
  });
  
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);

};
