const yaml = require('js-yaml')
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const { exec } = require("child_process");
require('dotenv').config();

const topic_map = process.env.TOPIC_MAP_DIR + '/' + process.env.TOPIC_MAP_FILE;

const docsDir = process.env.BASE_DIR + '/docs';

let currLevel = 0;
let topLevel = 'modules'
let currNavDoc = "";

// Function to delete the existing file if present
const deleteExistingFile = (filePath) => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        //console.log('Existing file deleted successfully.');
      } catch (err) {
        console.error('Error deleting the existing file:', err);
      }
    } 
  };

// Function to create a file and its parent directories recursively
const createFileWithDirectories = (filePath, content) => {
    // Extract the directory path from the file path
    const directoryPath = path.dirname(filePath);
  
    // Recursively create the parent directories
    fs.mkdir(directoryPath, { recursive: true }, (err) => {
      if (err) {
        console.error('Error creating directories:', err);
      } else {
        // Parent directories created successfully
        // Now, create the file and write content to it
        fs.writeFile(filePath, content, (err) => {
          if (err) {
            console.error('Error creating the file:', err);
          } else {
            //console.log('File created and content written successfully.');
          }
        });
      }
    });
  };


try {
    let fileContents = fs.readFileSync(topic_map, 'utf8');
    let data = yaml.loadAll(fileContents);

    console.log("nav:");

    for (var topic of data)
    {
        processTopic(topic, topLevel);
    }


    //console.log(data);
} catch (e) {
    console.log(e);
}

function processTopic(topic, dir)
{

    if (topic.Dir && topic.Dir.includes("rest_api"))
        return;



    currLevel++;

    if (topic.Dir)
    {

        let filespec = dir + "/" + topic.Dir
        let fullFilespec = docsDir + '/' + filespec


        if (currLevel == 1)
        {
            try {
                fs.mkdirSync(fullFilespec, { recursive: true });
                fs.mkdirSync(fullFilespec + "/pages", { recursive: true });
                //console.log('Directory created successfully.');
              } catch (err) {
                console.error('Error creating the directory:', err);
              }

            console.log("  - " + filespec + "/nav.adoc")

            currNavDoc = fullFilespec + "/nav.adoc";
            deleteExistingFile(currNavDoc)
            fs.appendFileSync(currNavDoc, "." + topic.Name + "\n")
            //console.log("create nav.adoc file " + currNavDoc);
            //fs.mkdirSync(currNavDoc, { recursive: true });
        } 
        else
        {
            fs.appendFileSync(currNavDoc, '*'.repeat(currLevel-1) + " " + topic.Name + "\n")
        }       


        //console.log(' '.repeat(currLevel*2) + "- \"" + topic.Name + "\":")
        //console.log('*'.repeat(currLevel) + " " + topic.Name )
        for (var subtopic of topic.Topics)
            processTopic(subtopic, dir + '/' + topic.Dir)

    }
    else
    {
        if (!topic.Distros ||  topic.Distros.includes(process.env.DISTRO) )
        {

            let filespec = dir + "/" + topic.File + ".adoc";
            //console.log(' '.repeat(currLevel*2) + "- \"" + topic.Name + "\": " + dir + "/" + topic.File + ".md")
            //console.log('*'.repeat(currLevel-1) + " " + filespec + "[" + topic.Name + "]" )


            const parts = filespec.split('/');
            let navspec = parts.slice(2).join('/')

            try {
                fs.appendFileSync(currNavDoc, '*'.repeat(currLevel-1) + " xref:" + navspec + "[" + topic.Name + "]\n");
                //console.log('Lines written to the file successfully.');
            } catch (err) {
                console.error('Error writing lines to the file:', err);
            }

            const moreparts = filespec.split('/');
            parts.splice(2, 0, "pages");
            const resultString = parts.join('/');

            let fullFilespec = docsDir + "/" + resultString;

            //console.log(fullFilespec);

            deleteExistingFile(fullFilespec)

            createFileWithDirectories(fullFilespec, "= " + topic.Name + "\n\nBlah blah \n");

        }
    }

    currLevel--;
}


