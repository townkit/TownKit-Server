To get started, simply run npm install.  
Once all packages have installed, cd into importers/united-kingdom

run  

> node server.js --import=true

This will import the demo data set into your database, then run the server  
(This assumes mongodb is running on localhost)

These URL's should now work:

http://localhost:8080/United-Kingdom  
http://localhost:8080/United-Kingdom/England

This should work
http://localhost:8080/United-Kingdom/England?limit[0]=*&limit[1]=5&limit[2]=3