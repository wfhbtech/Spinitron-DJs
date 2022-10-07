// ReadDJs-2022-04-01v2.js  
output.markdown('# Spinitron DJ Reader v2');

const ctlPanel = 'Control Panel';
const scriptView = 'View for Scripts';
const reconcileTable ='Spinitron Reconciliation';
const broadcastSchedTable = 'Sync Broadcast Schedule';
const membersTable = 'Sync MembersTable';
const spinitronTable = 'Spinitron DJs';

const sourceBoth = "Both";
const sourceGcal = "Google Calendar";
const sourceSpinitron = "Spinitron";

let table = base.getTable(ctlPanel);
// Get the control panel record (should be only one) 
let controlPanelRecord = await input.recordAsync('Select a record to use', table);

if (controlPanelRecord) {
} else {
    output.text('No record was selected');
}


// Purge old Spinitron Show records

output.markdown('# Purging old records...');
// Purge old MegaSeg Event File records
let oldRecords = await base.getTable(spinitronTable).getView('View for Scripts').selectRecordsAsync();
let recIDs = [];
for (let record of oldRecords.records) { recIDs.push(record.id); }
while (recIDs.length > 0) {
    dbMsg(recIDs);
    await base.getTable(spinitronTable).deleteRecordsAsync(recIDs.slice(0, 50));
    recIDs = recIDs.slice(50);
}

output.markdown('# Reading schedule on Spinitron site...');

let eventFileCreateRecords = [];
const itemCount = 200;
for (let pageNum = 1; ; pageNum++){ 
const response = await getSpinitronDJs (itemCount, pageNum);
dbMsg("Result from inside function");
dbMsg(response);

for (let item of response.items) {
    var sinceValue = "";
    if (item.since === null ) {
        sinceValue = 'null';
    } else {
        sinceValue = "Since" + item.since;
    }

    eventFileCreateRecords.push({
        fields: {
            "Spinitron Name":  item.name,
            "ID": item.id + "",
            "Bio": item.bio + "", 
            "Email": item.email + "", 
            "Since": sinceValue, 
            "Website": item.website + "", 
            "Image": item.image + "", 
            "Control Panel Link": [ controlPanelRecord ],
        },
    });
    }
    dbMsg ("length: " + response.items.length + " ... " + "page at end loop: " + pageNum);
    if (response.items.length < itemCount) { break; }
}


// Finally, create the Spinitron records.
output.markdown('# Creating Airtable table from Spinitron data');
while (eventFileCreateRecords.length > 0) {
    await base.getTable(spinitronTable).createRecordsAsync(eventFileCreateRecords.slice(0, 50));
    eventFileCreateRecords = eventFileCreateRecords.slice(50);
}

// Done!
output.markdown('# Done');


/*
    Return Spinitron DJs
*/
 async function getSpinitronDJs (itemCount, pageNum, ) {

    let params = {
        "count" : itemCount,
        "page" : pageNum
    };

    dbMsg ("paramz: " + params.page);

    let url = "https://spinitron.com/api/personas";
    url += '?' + new URLSearchParams(params).toString();
    dbMsg("url:" + url);
    let response = await remoteFetchAsync(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer vlcy-1eFKglIpNccDNcW-vZc',
            'Content-Type': 'application/json',
        },
    });

    let result = await response.json();
    return result;
}

function dbMsg (theMessage) {
// console.debug (theMessage);
    }