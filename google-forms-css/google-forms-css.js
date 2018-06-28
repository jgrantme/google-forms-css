/*

  google-forms-css
  version: 1.0.0

*/

var googleFormsCSS = function(params) {

  // jquery
  if (typeof jQuery === 'undefined') {
    console.error('google-forms-css > jquery not found');
    return;
  }

  // form url
  var formURL = params.formURL;
  if (!formURL.match('^https:\/\/docs.google.com\/forms\/.*')) {
    console.error('google-forms-css > invalid form url');
    return;
  }
  formURL = formURL.replace('viewform', 'formResponse');

  // request
  jQuery.get('google-forms-css/google-forms-css-cors.php?url=' + formURL, function(data) {

    //
    // parse
    //

    // form data
    var needle = 'var FB_PUBLIC_LOAD_DATA_ = ';
    var start = data.indexOf(needle);
    if (start === -1) {
      console.error('google-forms-css > form data not found');
      return;
    }
    var end = data.indexOf(';', start);
    var json = data.substring(start + needle.length, end);
    var formData = JSON.parse(json);

    // items
    var items = formData[1][1];
    items.forEach(function(item, index) {

      var title = item[1];
      var description = item[2];

      // type
      var type;
      switch(item[3]) {
        case 0: { // google forms: short answer
          if (item[4][0][4] && item[4][0][4][0][0] === 2 && item[4][0][4][0][1] === 102) { // google forms: response validation > text > email address
            type = 'email';
          } else {
            type = 'text';
          }
          break;
        }
        case 1: { // google forms: paragraph
          type = 'textarea';
          break;
        }
        case 2: { // google forms: multiple choice
          type = 'radio';
          break;
        }
        case 3: { // google forms: dropdown
          type = 'select';
          break;
        }
        case 4: { // google forms: checkboxes
          type = 'checkbox';
          break;
        }
        case 6: { // google forms: title and description
          type = 'section';
          break;
        }
        case 9: { // google forms: date
          type = 'date';
          break;
        }
        case 10: { // google forms: time
          type = 'time';
          break;
        }
        default: {
          console.warn('google-forms-css > unsupported:', title);
          return;
        }
      }

      if (type !== 'section') {
        var name = item[4][0][0];
        var required = item[4][0][2] ? true : false;
      }

      // options
      if (type === 'checkbox' || type === 'radio' || type === 'select') {
        var options = [];
        item[4][0][1].forEach(function(item, index) {
          options.push(item[0]);
        });
      }

      // console.log('google-forms-css > title:', title);
      // console.log('google-forms-css > description:', description);
      // console.log('google-forms-css > type:', type);
      // console.log('google-forms-css > name:', name);
      // console.log('google-forms-css > required:', required);
      // console.log('google-forms-css > options:', options);

      //
      // build
      //

      // section
      if (type === 'section') {

        var group = jQuery('<div class="form-group" style="margin: 2rem 0;"></div>');

        // title
        if (title) {
          var titleEl = jQuery('<div class="h2"></div>');
          titleEl.text(title);
          group.append(titleEl);
        }

        // description
        if (description) {
          var descriptionEl = jQuery('<p></p>');
          description = description.split('\n').join('<br>');
          descriptionEl.html(description);
          group.append(descriptionEl);
        }

        jQuery('#google-forms-css-form').append(group);
        return;

      }

      var group = jQuery('<div class="form-group"></div>');

      // label
      if (title || description) {

        var labelEl = jQuery('<label></label>');
        if (type !== 'checkbox' && type !== 'radio') {
          labelEl.attr('for', 'google-forms-css-' + name);
        }

        // title
        if (title) {
          var titleEl = jQuery('<div></div>');
          titleEl.text(title);
          if (required) {
            titleEl.append(' <span class="text-danger">*</span>');
          }
          labelEl.append(titleEl);
        }

        // description
        if (description) {
          var descriptionEl = jQuery('<small class="text-muted"></small>');
          descriptionEl.text(description);
          labelEl.append(descriptionEl);
        }

        group.append(labelEl);

      }

      // checkbox / radio
      if (type === 'checkbox' || type === 'radio') {

        options.forEach(function(item, index) {

          var id = 'google-forms-css-' + name + '-' + index;
          var inputVal = item;
          var labelVal = item;

          // other
          if (item === '') {
            inputVal = '__other_option__';
            labelVal = 'Other:';
          }

          var check = jQuery('<div class="form-check"></div>');

          // input
          var input = jQuery('<input class="form-check-input">');
          input.attr('id', id);
          input.attr('name', 'entry.' + name);
          input.attr('required', required);
          input.attr('type', type);
          input.attr('value', inputVal);

          // update required
          if (type === 'checkbox' && required) {
            input.change(function() {
              var name = $(this).attr('name');
              var siblings = $('[name="' + name + '"]');
              var satisfied = false;
              siblings.each(function(index) {
                var checked = $(this).is(':checked');
                $(this).attr('required', checked);
                if (checked) {
                  satisfied = true;
                }
              });
              if (!satisfied) {
                siblings.attr('required', true);
              }
            });
          }

          check.append(input);

          // check label
          var checkLabel = jQuery('<label class="form-check-label"></label>');
          checkLabel.attr('for', id);
          checkLabel.text(labelVal);
          check.append(checkLabel);

          // other
          if (item === '') {
            var otherInput = jQuery('<input class="form-control" type="text">');
            otherInput.attr('id', name + '-other');
            otherInput.attr('name', 'entry.' + name + '.other_option_response');
            otherInput.hide();
            check.append(otherInput);
          }

          // update other
          input.change(function() {
            var name = $(this).attr('name');
            var parent = $('input[name="' + name + '"][value="__other_option__"]');
            if (parent.length) {
              var child = $('input[name="' + name + '.other_option_response"]');
              var checked = parent.is(':checked');
              child.attr('required', checked);
              if (checked) {
                child.show();
              } else {
                child.hide();
              }
            }
          });

          group.append(check);

        });

      }

      // select
      else if (type === 'select') {

        var select = jQuery('<select class="form-control"></select>');
        select.attr('id', 'google-forms-css-' + name);
        select.attr('name', 'entry.' + name);
        select.attr('required', required);

        select.append('<option value="">Choose</option>');

        options.forEach(function(item, index) {
          var option = jQuery('<option></option>');
          option.text(item);
          select.append(option);
        });

        group.append(select);

      }

      // email / text / textarea
      else {

        if (type === 'textarea') {
          var input = jQuery('<textarea class="form-control" rows="3"></textarea>');
        } else {
          var input = jQuery('<input class="form-control">');
          input.attr('type', type);
        }

        input.attr('id', 'google-forms-css-' + name);
        input.attr('name', 'entry.' + name);
        input.attr('placeholder', params.placeholderText);
        input.attr('required', required);

        group.append(input);

      }

      jQuery('#google-forms-css-form').append(group);

    });

    jQuery('#google-forms-css-form').append('<div class="form-group"><button class="btn btn-primary" type="submit">Submit</button></group>');
    jQuery('#google-forms-css-loading').hide();
    jQuery('#google-forms-css-main').show();

  });

  //
  // submit
  //

  jQuery('#google-forms-css-form').on('submit', function(e) {

    e.preventDefault();

    // request
    jQuery.ajax({
      url: formURL,
      data: jQuery(this).serialize(),
    }).always(function() {

      console.warn('google-forms-css > don\'t worry, \'failed to load\' is expected');

      // confirmation
      if (params.confirmationURL) {
        window.location.href = params.confirmationURL;
      } else {
        jQuery('#google-forms-css-main').hide();
        jQuery('#google-forms-css-confirmation').show();
      }

    });

    jQuery('#google-forms-css-form input,#google-forms-css-form select,#google-forms-css-form textarea').attr('disabled', true);

  });

}
