document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('none'));

  // By default, load the inbox
  load_mailbox('inbox');

  // Event listener for sending an email
  document.querySelector('#compose-form').onsubmit = () => {
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    // POST email to API
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
      .then(response => response.json())
      .then(result => {
        // Print result
        console.log(result);
      });

    load_mailbox('sent')


    return false;
  }
});

function compose_email(replyEmail) {
  console.log(replyEmail)
  // Show compose view and hide other views
  document.querySelector('#inbox-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  if (replyEmail != 'none') {
    // Pre-fill composition fields if user is replying
    document.querySelector('#compose-recipients').value = `${replyEmail["sender"]}`;
    if (replyEmail["subject"].startsWith('Re: ')) {
      document.querySelector('#compose-subject').value = `${replyEmail["subject"]}`;
    } else {
      document.querySelector('#compose-subject').value = `Re: ${replyEmail["subject"]}`;
    }
    document.querySelector('#compose-body').value = `\n\n"On ${replyEmail["timestamp"]} ${replyEmail["sender"]} wrote:" \n${replyEmail["body"]}`;
  }
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#inbox-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#inbox-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET email to API
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);

      for (let i = 0; i < result.length; i++) {
        let emailRow = document.createElement('button')
        emailRow.setAttribute('id', `emailRow-${i}`)
        emailRow.setAttribute('class', 'emailRow')
        emailRow.setAttribute('data-id', result[i]["id"])
        let emailRecipients = document.createElement('b')
        emailRecipients.setAttribute('class', 'emailRecipients')
        let emailSubject = document.createElement('span')
        emailSubject.setAttribute('class', 'emailSubject')
        emailSubject.innerHTML = result[i]["subject"]
        let emailTimestamp = document.createElement('span')
        emailTimestamp.setAttribute('class', 'emailTimestamp')
        emailTimestamp.innerHTML = result[i]["timestamp"]

        // Set sender
        if (mailbox === "inbox") {
          emailRecipients.innerHTML = result[i]["sender"]
        } else {
          emailRecipients.innerHTML = result[i]["recipients"]
        }

        // Set borders
        if (result[i]["read"] === false) {
          emailRow.style.backgroundColor = "#666"
          emailTimestamp.style.color = "#fff"
        } else {
          emailRow.style.backgroundColor = "#fff"
        }

        document.querySelector('#inbox-view').appendChild(emailRow)
        document.querySelector(`#emailRow-${i}`).appendChild(emailRecipients)
        document.querySelector(`#emailRow-${i}`).appendChild(emailSubject)
        document.querySelector(`#emailRow-${i}`).appendChild(emailTimestamp)

      }
      load_email(mailbox)

    });

  return false;
}

function load_email(mailbox) {
  document.querySelectorAll('button.emailRow').forEach(button =>
    button.onclick = () => {
      fetch(`/emails/${button.dataset.id}`)
        .then(response => response.json())
        .then(result => {
          // Show the mail and hide other views
          document.querySelector('#inbox-view').style.display = 'none';
          document.querySelector('#compose-view').style.display = 'none';
          document.querySelector('#email-view').style.display = 'block';

          if (mailbox === 'sent') {
            document.querySelector('#archiveButton').style.display = 'none';
          } else {
            document.querySelector('#archiveButton').style.display = 'inline-block';
          }

          // Clear out composition fields
          document.querySelector('#emailSender').value = '';
          document.querySelector('#emailRecipients').value = '';
          document.querySelector('#emailSubject').value = '';
          document.querySelector('#emailTimestamp').value = '';
          document.querySelector('#archiveButton').value = '';

          // Populate composition fields
          document.querySelector('#emailSender').innerHTML = (`${result["sender"]}`)
          document.querySelector('#emailRecipients').innerHTML = (`${result["recipients"]}`)
          document.querySelector('#emailSubject').innerHTML = (`${result["subject"]}`)
          document.querySelector('#emailTimestamp').innerHTML = (`${result["timestamp"]}`)
          document.querySelector('#emailBody').innerHTML = (`${result["body"]}`)
          if (result["archived"] === true) {
            document.querySelector('#archiveButton').innerHTML = ('Unarchive')
          } else {
            document.querySelector('#archiveButton').innerHTML = ('Archive')
          }

          fetch(`/emails/${button.dataset.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              read: true
            })
          });

          document.querySelector('#archiveButton').onclick = () => {
            let archiveStatus = true
            if (result["archived"] === true) {
              archiveStatus = false
            }
            fetch(`/emails/${button.dataset.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: archiveStatus
              })
            });
            setTimeout(() => { load_mailbox('inbox') }, 200);
          };

          document.querySelector('#replyButton').onclick = () => compose_email(result);


          // Print result
          console.log(result);

        })
    }
  );
}