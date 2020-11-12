# DEPLOYMENT

## Prerequisite

- A server with NodeJS installed
- An Apache web server
- A configuration for s3 such as Secret Key, Key ID, Bucket name, etc\
  Create a new file called .env and paste it. You may need to fill it with your own credentials

```sh
# PORT 8080 is required to make our application running on Apache
PORT="8080"
ACCESS_KEY_ID=""
SECRET_ACCESS_KEY=""
BUCKET_NAME=""
```

## Installation

I assume that you have successfully installed all of prerequisite above. The default folder for Apache is located in /var/www/html so go there and clone this repository.

```sh
$cd /var/www/html
$git clone https://github.com/aldycavalera/s3-upload-files.git .
```

Now we have all code cloned, you should see a new files created.
We should then install all required modules by installing all modules inside our root folder (/var/www/html)

```sh
$npm install
```

If all processes are done, create a new file inside our dist folder called server.js or whatever you want

```sh
$cd ./dist
$touch server.js
$nano server.js
```

and paste this code

```sh
import * as dotenv from "dotenv";
dotenv.config();
import * as express from "express";
import { Uploader } from "./index";

const upload = new Uploader();
const app = express();
const port = process.env.PORT;
const bodyPraser = require("body-parser");

app.use(
  bodyPraser.urlencoded({
    extended: false,
  })
);
app.listen(port);
console.log(`Server listening on port ${port}`);
upload.upload(app);
```

Try to run the application by typing

```sh
$node ./dist/server.js
```

it should say that your server is running on your given port. `Server listening on port 3000`

And voila! Your application has been created, but when you access your website, it wouldn't showing anything yet. We need to configure our Apache to handle proxy and port we have been given.

## Configuring Apache

We have been installing our application but your browser given nothing. To fix that problem with reverse proxy.
First thing first, make sure you have logged in to your terminal (on VPS or whatever), we should then enabling necessary Apache modules by executing these commands:

```sh
$sudo a2enmod proxy
$sudo a2enmod proxy_http
$sudo a2enmod proxy_balancer
$sudo a2enmod lbmethod_byrequests
```

To put these changes into effect, restart Apache.

```sh
$sudo systemctl restart apache2
```

Next step is we should modifying the default configuration to enable Reverse Proxy
Open the default Apache configuration file using `nano` or your favorite text editor.

```sh
$sudo  nano /etc/apache2/sites-available/000-default.conf
```

Add these contents within `VirtualHost` block with the following, so your configuration file looks like this:

```bash
<VirtualHost *:80>
 ...
    ProxyPreserveHost On

    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/
    ...
</VirtualHost>
```

To put these changes into effect, restart Apache.

```sh
$sudo systemctl restart apache2
```

Now we have configuring our Apache and ready to serve our Application

## Serve the App Using PM2

After configuring our Apache server, we should then install PM2 to serve our application. To do this, you can simply run this command

```sh
$npm install pm2
```

To run our service using PM2, run this command

```sh
npx pm2 start ./dist/server.js
```

Voila! your app has been served. Now go to your website, you should see an Error page saying that **Cannot GET /**

## Testing Our App

To test our running app, use API testing application like Postman, Hoppscotch or whatever you like.
Then hit your website with POST request and _/upload_ as its endpoint. Make sure you fill its form data with input file.
If its success, you should see following object returns

```sh
[
 {
  "ETag":  "\"e366b53eeacb9a0e3aef540e1507****\"",
  "VersionId":  "GiG38lh1LzazZcZGysrtQj0Xjm5*****",
  "Location":  "https://YOUR_BUCKET.s3.ap-southeast-1.amazonaws.com/1a047a48b825411012bd5839aa6*****%20%281%29.jpg",
  "key":  "1a047a48b825411012bd5839aa6***** (1).jpg",
  "Key":  "1a047a48b825411012bd5839aa6***** (1).jpg",
  "Bucket":  "YOUR_BUCKET"
 }
]
```

## Extended Configuration

You may need to configure your application using your own configuration. If so, please se [CONFIGURATION.md](https://github.com/aldycavalera/s3-upload-files/blob/main/CONFIGURATION.md)
