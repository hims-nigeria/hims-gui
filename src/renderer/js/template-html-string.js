"use strict";


module.exports.updateName = fullName => {
    return `
             <label class="name-update">
                  <span> Name </span>
                  <input type="text" name="fullName" value=${fullName} required>
             </label>
     `;
};

module.exports.updateEmail = email => {
    return `
            <label class="email-update">
                 <span> Email </span>
                 <input type="email" value=${email} name="email" disabled >
            </label>
     `;
};

module.exports.updateAddress = address => {
    return `
            <label class="address-update">
                 <span> Address </span>
                 <textarea type="email" name="address">${address}</textarea>
            </label>
     `;
};



module.exports.updatePhoneNumber = phoneNumber => {
    return `
            <label class="address-update">
                 <span> Phone </span>
                 <input type="text" name="phoneNumber" value=${phoneNumber}>
            </label>
     `;
};

module.exports.updateImage = image => `
     <label class="image-update">
          <span> Image </span>
          <image class="previewer" src=${(new TextDecoder().decode(image))} >
          <input type="file" name="image" hidden>
          <button type="button" class="select-image"> select image </button>
     </label>
`;

module.exports.updateButton = `<button type="submit" class="update-profile"> Update Profile </button>`;

module.exports.updatePassword = `

      <label class="update-password">
         <span> Current Password </span>
         <input type="password" name="currentPassword" required />
      </label>

      <label class="update-password">
          <span> New Password </span>
          <input type="password" name="password" required/>
      </label>

      <label class="update-password">
          <span> Confirm Password </span>
          <input type="password" name="confirmPassword" required/>
      </label>
`;
