module.exports = {
  plugins: [
    require('stylelint')({
      config: {
        extends: 'stylelint-config-standard',
      },
    }),
    require('autoprefixer'),
    require('postcss-nested'),
    require('postcss-reporter')({ clearReportedMessages: true }),
  ],
};
