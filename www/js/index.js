document.addEventListener('deviceready', onDeviceReady, false);

let allContacts = [];
let currentContactId = null;

function onDeviceReady() {
  loadContacts();
  setupEventHandlers();
}

function setupEventHandlers() {  $(document).on('click', '#saveContactButton', function () {
    const name = $('#contactNameInput').val();
    const phone = $('#contactPhoneInput').val();
    const email = $('#contactEmailInput').val();

    // alert(name);
    // return;

    // console.log(`Name: ${name}, Phone: ${phone}, Email: ${email}`);
    
    if (!name) {
      alert('Le nom est obligatoire');
      return;
    }

    const contactData = {
      displayName: name
    };

    if (phone) {
      contactData.phoneNumbers = [{
        type: 'mobile',
        value: phone,
        pref: true
      }];
    }


    if (email) {
      contactData.emails = [{
        type: 'home',
        value: email,
        pref: true
      }];
    }

    createContact(contactData);
  });

  $(document).on('click', 'a[data-contact-id]', function () {
    const contactId = $(this).data('contact-id');
    currentContactId = contactId;
    displayContactDetails(contactId);
  });

  $(document).on('click', '#deleteContact', function () {
    if (currentContactId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce contact?')) {
        deleteContact(currentContactId);
      }
    }
  });

  $(document).on('click', '.updateButton', function () {
    if (currentContactId) {
      navigateToEditPage(currentContactId);
    }
  });

  $(document).on('click', '#updateContactButton', function () {
    const updatedData = {
      displayName: $('#editContactName').val(),
      name: { givenName: $('#editContactName').val() },
      phoneNumbers: [{ type: 'mobile', value: $('#editContactPhone').val() }],
      emails: [{ type: 'home', value: $('#editContactEmail').val() }]
    };
    updateContact(currentContactId, updatedData);
  });
}

function loadContacts() {
  let options = new ContactFindOptions();
  options.multiple = true;
  options.hasPhoneNumber = true;

  let fields = ["*"];
  navigator.contacts.find(fields, (contacts) => {
    allContacts = contacts;
    showContacts(contacts);
    populateContactListElement(contacts);
  }, onError);
}

function showContacts(contacts) {
  $('.sectionHeader p').text(`${contacts.length} contacts`);
}

function populateContactListElement(contacts) {
  const contactListElement = $('#contactList');
  contactListElement.empty();

  contacts.forEach(contact => {
    const avatar = contact.displayName ? contact.displayName.charAt(0).toUpperCase() : '?';
    const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0 ? contact.phoneNumbers[0].value : 'No phone';

    const listItem = $('<li>').addClass('contactListItem');

    listItem.html(`
      <a href="#contactDetailsPage" data-contact-id="${contact.id}">
        <img src="img/contact.png" alt="Photo de contact">
        <h>${contact.displayName || 'Aucun nom'}</h>
        <p>${phone}</p>
      </a>
    `);

    contactListElement.append(listItem);
  });

  contactListElement.listview('refresh');
}

function displayContactDetails(contactId) {
  const contact = allContacts.find(c => c.id === contactId.toString());
  if (contact) {
    if (contact.photos && contact.photos.length > 0) {
      $('.contactDetailsAvatar').attr('src', contact.photos[0].value);
    } else {
      $('.contactDetailsAvatar').attr('src', 'img/contact.png');
    }

    $('#contactDetailsPage').find('h2').text(contact.displayName || 'No Name');

    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      const phone = contact.phoneNumbers[0].value ?? 'Aucun numéro';
      $('#contactPhone').text(phone);
    }
    else {
      $('#contactPhone').text('Aucun numéro');
    }
    // Définir les détails de l'email
    if (contact.emails && contact.emails.length > 0) {
      const email = contact.emails[0].value ?? 'Aucun email';
      $('#contactEmail').text(email);
    }
    else {
      $('#contactEmail').text('Aucun email');
    }

    //Definir les détails de l'adresse
    if (contact.addresses && contact.addresses.length > 0) {
      const address = contact.addresses[0].formattedAddress ?? 'Aucune adresse';
      $('#contactAddress').text(address);
    }
    else {
      $('#contactAddress').text('Aucune adresse');
    }
  }
}

function navigateToEditPage(contactId) {
  const contact = allContacts.find(c => c.id === contactId.toString());

  if (contact) {
    // Pré-remplir le formulaire d'édition
    $('#editContactName').val(contact.displayName || '');

    const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0 ?
      contact.phoneNumbers[0].value : '';
    $('#editContactPhone').val(phone);

    const email = contact.emails && contact.emails.length > 0 ?
      contact.emails[0].value : '';
    $('#editContactEmail').val(email);

    // Naviguer vers la page d'édition
    $.mobile.changePage('#editContactPage');
  }
}

function onError(error) {
  console.log(error);
  alert("Error: " + error.code);
}

// Add a new contact
function createContact(contactData) {
  try {
    const contact = navigator.contacts.create();
    
    // Création et configuration du nom en utilisant ContactName
    const name = new ContactName();
    const nameParts = contactData.displayName.split(' ');
    name.givenName = nameParts[0] || '';
    name.familyName = nameParts.slice(1).join(' ') || '';
    name.formatted = contactData.displayName;
    
    // Assigner les propriétés au contact
    contact.name = name;
    contact.displayName = contactData.displayName;

    // Ajout du numéro de téléphone
    if (contactData.phoneNumbers && contactData.phoneNumbers.length > 0) {
      contact.phoneNumbers = contactData.phoneNumbers;
    }

    // Ajout de l'email
    if (contactData.emails && contactData.emails.length > 0) {
      contact.emails = contactData.emails;
    }

    contact.save(
      () => {
        alert('Contact créé avec Succès!');
        // Recharger les contacts et retourner à la page d'accueil
        loadContacts();
        $.mobile.changePage('#homePage');
        // Réinitialiser le formulaire
        $('#addContactForm')[0].reset();
      },
      (error) => {
        console.error('Error saving contact:', error);
        alert('Erreur lors de la création du contact: ' + (error.code || error));
      }
    );
  } catch (e) {
    console.error('Error creating contact:', e);
    alert('Erreur lors de la création du contact: ' + e.message);
  }
}

// Update an existing contact
function updateContact(contactId, updatedData) {
  let options = new ContactFindOptions();
  options.filter = contactId;
  options.multiple = false;

  navigator.contacts.find(['id'], (contacts) => {
    if (contacts.length > 0) {
      let contact = contacts[0];
      // Mettre à jour les propriétés du contact
      if (updatedData.displayName) contact.displayName = updatedData.displayName;
      if (updatedData.name) contact.name = updatedData.name;
      // Mettre à jour les numéros de téléphone
      if (updatedData.phoneNumbers && updatedData.phoneNumbers.length > 0) {
        if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
          contact.phoneNumbers = updatedData.phoneNumbers;
        } else {
          contact.phoneNumbers[0].value = updatedData.phoneNumbers[0].value;
          contact.phoneNumbers[0].type = updatedData.phoneNumbers[0].type || contact.phoneNumbers[0].type;
        }
      }

      // Mettre à jour les emails
      if (updatedData.emails && updatedData.emails.length > 0) {
        if (!contact.emails || contact.emails.length === 0) {
          contact.emails = updatedData.emails;
        } else {
          contact.emails[0].value = updatedData.emails[0].value;
          contact.emails[0].type = updatedData.emails[0].type || contact.emails[0].type;
        }
      }


      contact.save(
        () => {
          alert('Le contact a bien été mis à jour!');

          loadContacts();
          $.mobile.changePage('#homePage');
        },
        (error) => alert('Error updating contact: ' + error.code)
      );
    } else {
      alert('Contact non trouvé');
    }
  }, onError, options);
}

// Delete a contact
function deleteContact(contactId) {
  let options = new ContactFindOptions();
  options.filter = contactId;
  options.multiple = false;

  navigator.contacts.find(['id'], (contacts) => {
    if (contacts.length > 0) {
      let contact = contacts[0];
      contact.remove(
        () => {
          alert('Contact supprimé avec succès!');
          // Recharger les contacts et retourner à la page d'accueil
          loadContacts();
          $.mobile.changePage('#homePage');
        },
        (error) => alert('Error deleting contact: ' + error.code)
      );
    } else {
      alert('Contact not found');
    }
  }, onError, options);
}