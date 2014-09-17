module.exports = function (path, config) {
  var sharp = require('sharp');
  var gm = require('gm');

  var Image = {
    'getGravity': function(gravity) {
      gravity = gravity ? gravity : 'center';
      gravity = gravity == 'centre' ? 'center' : gravity;
      return gravity;
    },

    'getDestination': function (width, height, gravity, blur, filePath, prefix) {
      return config.cache_folder_path + '/' + prefix + path.basename(filePath, path.extname(filePath)) + '-' + width + 'x' + height + '-' + gravity + (blur ? '-blur' : '') + '.jpg';
    },

    'getShortDestination': function (width, height, gravity, blur, filePath, prefix) {
      return config.cache_folder_path + '/' + prefix + width + '^' + height + '-' + gravity + (blur ? '-blurred' : '') + '.jpg';
    },

    'getAndCheckDestination': function (width, height, gravity, blur, filePath, prefix, shortName, callback) {
      var destination = shortName ? this.getShortDestination(width, height, gravity, blur, filePath, prefix) : this.getDestination(width, height, gravity, blur, filePath, prefix);
      fs.exists(destination, function (exists) {
        callback(exists, destination);
      })
    },

    'imageResize': function (width, height, gravity, filePath, destination, callback) {
      try {
        sharp(filePath).rotate().resize(width, height).crop(sharp.gravity[gravity]).jpeg().progressive().toFile(destination, function (err) {
          callback(err, destination);
        });
      } catch (e) {
        callback(e, null);
      }
    },

    'getProcessedImage': function (width, height, gravity, gray, blur, filePath, shortName, callback) {
      gravity = this.getGravity(gravity);
      this.getAndCheckDestination(width, height, gravity, blur, filePath, gray ? 'gray-' : '', shortName, function (exists, destination) {
        if (exists) {
          return callback(null, destination);
        }
        this.imageResize(width, height, gravity, filePath, destination, function (err, destination) {
          if (err) {
            return callback(err);
          }
          if (gray) {
            var modifyImage = gm(destination).colorspace('GRAY');
            if (blur) {
              modifyImage.blur(0, 5);
            }
            modifyImage.write(destination, function (err) {
              if (err) {  
                return callback(err);
              }
              callback(null, destination);
            })
          } else {
            if (blur) {
              gm(destination).blur(0, 5).write(destination, function (err) {
                if (err) {
                  return callback(err);
                }
                callback(null, destination);
              })
            } else {
              callback(null, destination);
            }
          }
        })
      })
    },

    'getWidthAndHeight': function (params, square, callback) {
      var width = square ? params.size : params.width;
      var height = square ? params.size : params.height;
      callback(width, height);
    }
  }

  return Image;
}