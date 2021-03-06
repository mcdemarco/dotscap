var _ = require('underscore');

module.exports = function(grunt) {
	grunt.config.merge({
		browserify: {
			default: {
				files: {
					'build/dotscap.js': 'src/index.js'
				},
				options: {
					browserifyOptions: {
						debug: true,
						detectGlobals: false
					},
					watch: true
				}
			},
			release: {
				files: {
					'build/dotscap.js': 'src/index.js'
				},
				options: {
					browserifyOptions: {
						debug: false,
						detectGlobals: false
					},
					transform: [['uglifyify', { global: true }]]
				}
			}
		},
		watch: {
			template: {
				files: 'src/index.html',
				tasks: ['html']
			}
		}
	});

	grunt.registerTask('html:release', function() {
		var template = _.template(grunt.file.read('src/index.html'));

		var data = {
			name: '{{STORY_NAME}}',
			passages: '{{STORY_DATA}}',
			script: '<script>' + grunt.file.read('build/dotscap.js') + '</script>'
		};

		grunt.file.write('build/format.html', template(data));
	});

	grunt.registerTask('html:release1', function() {
		var template = _.template(grunt.file.read('src/index.html'));

		var data = {
			name: 'DotScap',
			passages: '<div id="storeArea" data-size="STORY_SIZE" hidden>"STORY"</div>',
			script: '<script>' + grunt.file.read('build/dotscap.js') + '</script>'
		};

		grunt.file.write('build/header.html', template(data));
	});

	grunt.registerTask('build', ['browserify:default']);
	grunt.registerTask('build:release', ['browserify:release', 'html:release', 'html:release1']);
	grunt.registerTask('default', ['build']);
	grunt.registerTask('dev', ['build', 'watch']);
};
