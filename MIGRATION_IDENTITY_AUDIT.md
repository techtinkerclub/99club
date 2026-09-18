# Standalone migration identity audit

Remaining legacy identifiers after public rebrand:

assets/99club/banner-actions-v1.js:171:    const endpoint=['https://formsubmit.co/ajax/','techtinkerclub','@','gmail.com'].join('');
assets/99club/banner-actions-v1.js:210:        status.innerHTML='Sorry, the message could not be sent just now. Please try again, or email <a href="mailto:techtinkerclub@gmail.com">techtinkerclub@gmail.com</a>.';
assets/99club/app.js:807:      const endpoint=['https://formsubmit.co/ajax/','techtinkerclub','@','gmail.com'].join('');
assets/99club/app.js:852:          status.innerHTML='Sorry, the message could not be sent just now. Please try again, or email <a href="mailto:techtinkerclub@gmail.com">techtinkerclub@gmail.com</a>.';
assets/99club/banner-actions-v2.js:70:    const endpoint=['https://formsubmit.co/ajax/','techtinkerclub','@','gmail.com'].join(''),original=send?.textContent||'Send message';
assets/99club/banner-actions-v2.js:77:    }catch(err){console.error('99 Club contact form:',err);if(status){status.className='tt99-contact-status is-error';status.innerHTML='Sorry, the message could not be sent just now. Please try again, or email <a href="mailto:techtinkerclub@gmail.com">techtinkerclub@gmail.com</a>.';}}
assets/99club/99club.css:1006:/* Standalone 99 Club Studio: hide the legacy Tech Tinker Club support
