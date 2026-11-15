/**
 * ZaaykaTech Owner Onboarding Translation Dictionary
 * Structured for multiple languages (English default, Hindi ready).
 * Plain words, high clarity for non-technical restaurant owners.
 */

export type OnboardingLocale = 'en' | 'hi';

export interface OnboardingStrings {
  header: {
    stepFormat: (step: number, question: number, totalQuestions: number) => string;
    needHelpWhatsApp: string;
    signOut: string;
    saved: string;
    saving: string;
  };
  navigation: {
    continue: string;
    back: string;
    skip: string;
    tryAgain: string;
    saveAndContinue: string;
    goLive: string;
  };
  step1: {
    stepTitle: string;
    // 1a: Restaurant Name
    name: {
      question: string;
      helper: string;
      placeholder: string;
      example: string;
      errorRequired: string;
    };
    // 1b: Food Type / Cuisine
    foodType: {
      question: string;
      helper: string;
      options: {
        veg: { label: string; desc: string };
        nonveg: { label: string; desc: string };
        cafe: { label: string; desc: string };
        sweets: { label: string; desc: string };
        bakery: { label: string; desc: string };
        other: { label: string; desc: string };
      };
      otherPlaceholder: string;
      errorRequired: string;
    };
    // 1c: Phone Number
    phone: {
      question: string;
      helper: string;
      placeholder: string;
      example: string;
      errorInvalid: string;
    };
    // 1d: City
    city: {
      question: string;
      helper: string;
      placeholder: string;
      example: string;
      errorRequired: string;
    };
  };
  step2: {
    stepTitle: string;
    // 2a: Logo
    logo: {
      question: string;
      helper: string;
      uploadLabel: string;
      uploading: string;
      success: string;
      errorUpload: string;
    };
    // 2b: Preset Style
    style: {
      question: string;
      helper: string;
      presets: {
        warm: { name: string; desc: string };
        minimal: { name: string; desc: string };
        dark: { name: string; desc: string };
        heritage: { name: string; desc: string };
      };
    };
    // 2c: Cover Photo
    cover: {
      question: string;
      helper: string;
      uploadLabel: string;
      uploading: string;
      success: string;
      errorUpload: string;
    };
  };
  step3: {
    stepTitle: string;
    // 3a: First Category
    category: {
      question: string;
      helper: string;
      placeholder: string;
      chips: string[];
      errorRequired: string;
    };
    // 3b: First Dish
    dish: {
      question: string;
      helper: string;
      nameLabel: string;
      namePlaceholder: string;
      priceLabel: string;
      pricePlaceholder: string;
      categoryLabel: string;
      errorName: string;
      errorPrice: string;
      dishAddedSuccess: string;
    };
    // 3c: More Dishes / OCR / Later
    more: {
      question: string;
      helper: string;
      addAnotherDish: string;
      photographMenu: string;
      doThisLater: string;
      requirementWarning: string;
    };
  };
  step4: {
    stepTitle: string;
    review: {
      question: string;
      helper: string;
      editSection: string;
      restaurantDetails: string;
      brandingAndStyle: string;
      menuItems: string;
      dishesCount: (count: number) => string;
      categoriesCount: (count: number) => string;
      continueToGoLive: string;
    };
  };
  step5: {
    stepTitle: string;
    // 5a: Ready to Go Live
    ready: {
      question: string;
      helper: string;
      buttonText: string;
      publishing: string;
      notice: string;
    };
    // 5b: Live confirmation & QR
    live: {
      question: string;
      helper: string;
      qrTitle: string;
      qrSubtitle: string;
      copyLink: string;
      copied: string;
      shareWhatsApp: string;
      downloadQR: string;
      goToDashboard: string;
      whatsAppShareMessage: (name: string, url: string) => string;
    };
  };
}

export const ONBOARDING_I18N: Record<OnboardingLocale, OnboardingStrings> = {
  en: {
    header: {
      stepFormat: (step, question, totalQuestions) =>
        `Step ${step} of 5 · Question ${question} of ${totalQuestions}`,
      needHelpWhatsApp: 'Need help? WhatsApp',
      signOut: 'Sign Out',
      saved: 'Saved',
      saving: 'Saving...',
    },
    navigation: {
      continue: 'Continue',
      back: 'Back',
      skip: 'Skip for now',
      tryAgain: 'Try again',
      saveAndContinue: 'Save & Continue',
      goLive: 'Go Live Now',
    },
    step1: {
      stepTitle: 'About you',
      name: {
        question: "What is your restaurant's name?",
        helper: 'This name will appear on your customer menu and table QR codes.',
        placeholder: 'e.g., Zaayka Haveli',
        example: 'Example: Royal Biryani House, Chai Tapri',
        errorRequired: 'Please enter your restaurant name (at least 2 letters).',
      },
      foodType: {
        question: 'What do you serve?',
        helper: 'Pick the option that best describes your food so diners know what to expect.',
        options: {
          veg: { label: 'Pure Veg', desc: 'Strictly vegetarian dishes only' },
          nonveg: { label: 'Veg & Non-Veg', desc: 'Both vegetarian and meat dishes' },
          cafe: { label: 'Cafe', desc: 'Coffee, tea, quick bites and snacks' },
          sweets: { label: 'Sweets', desc: 'Mithai, desserts and traditional savouries' },
          bakery: { label: 'Bakery', desc: 'Fresh cakes, pastries and baked goods' },
          other: { label: 'Other', desc: 'Custom food type or specific cuisine' },
        },
        otherPlaceholder: 'Describe your food (e.g., South Indian, Street Food)',
        errorRequired: 'Please select what you serve.',
      },
      phone: {
        question: 'What is your contact phone number?',
        helper: 'A 10-digit mobile number for business contact and support.',
        placeholder: '10-digit mobile number',
        example: 'Example: 9876543210',
        errorInvalid: 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.',
      },
      city: {
        question: 'Which city is your restaurant located in?',
        helper: 'Helps customers verify they are looking at the right outlet.',
        placeholder: 'e.g., Mumbai, Bengaluru, Jaipur',
        example: 'Example: Pune, Ahmedabad, Delhi',
        errorRequired: 'Please enter your city.',
      },
    },
    step2: {
      stepTitle: 'Look',
      logo: {
        question: 'Add your restaurant logo',
        helper: 'Optional. A clean square image of your logo appears at the top of your menu.',
        uploadLabel: 'Tap to upload logo image',
        uploading: 'Uploading logo...',
        success: 'Logo uploaded successfully',
        errorUpload: 'Logo upload failed. Please try again or skip for now.',
      },
      style: {
        question: 'Pick a color style for your menu',
        helper: 'Choose a style that matches your restaurant ambience. You can change this anytime.',
        presets: {
          warm: {
            name: 'Warm Amber',
            desc: 'Classic terracotta with warm creamy background',
          },
          minimal: {
            name: 'Modern Clean',
            desc: 'Crisp charcoal with pure white card borders',
          },
          dark: {
            name: 'Midnight Luxury',
            desc: 'Elegant dark slate with warm amber accents',
          },
          heritage: {
            name: 'Royal Heritage',
            desc: 'Deep crimson wine with vintage gold highlights',
          },
        },
      },
      cover: {
        question: 'Add a cover photo for your menu',
        helper: 'Optional. A photo of your dining space or signature dish displayed as a banner.',
        uploadLabel: 'Tap to upload cover photo',
        uploading: 'Uploading cover photo...',
        success: 'Cover photo uploaded successfully',
        errorUpload: 'Photo upload failed. Please try again or skip for now.',
      },
    },
    step3: {
      stepTitle: 'Menu',
      category: {
        question: 'Add your first menu category',
        helper: 'Categories group your dishes on the menu. Tap a suggestion below or type your own.',
        placeholder: 'Category name (e.g., Starters, Main Course)',
        chips: ['Starters', 'Main Course', 'Breads', 'Rice', 'Drinks', 'Desserts'],
        errorRequired: 'Please enter or select at least one category name.',
      },
      dish: {
        question: 'Add your first dish',
        helper: 'Enter the dish name and price. You can add descriptions and photos later.',
        nameLabel: 'Dish name',
        namePlaceholder: 'e.g., Paneer Butter Masala, Masala Chai',
        priceLabel: 'Price (₹)',
        pricePlaceholder: 'e.g., 220',
        categoryLabel: 'Category',
        errorName: 'Please enter a dish name.',
        errorPrice: 'Please enter a valid price in rupees (greater than 0).',
        dishAddedSuccess: 'Dish added successfully!',
      },
      more: {
        question: 'Your menu has started!',
        helper: 'You have added your first dish. How would you like to continue building your menu?',
        addAnotherDish: 'Add another dish by hand',
        photographMenu: 'Photograph your paper menu (OCR Scan)',
        doThisLater: "I'll do this later · Continue to Check",
        requirementWarning: 'Please add at least 1 category and 1 dish before continuing.',
      },
    },
    step4: {
      stepTitle: 'Check',
      review: {
        question: 'Check your digital menu',
        helper: 'This is a live preview of what diners will see on their phones. Tap Edit to change any section.',
        editSection: 'Edit',
        restaurantDetails: 'Restaurant Details',
        brandingAndStyle: 'Branding & Style',
        menuItems: 'Menu Items',
        dishesCount: (count) => `${count} dish${count === 1 ? '' : 'es'} added`,
        categoriesCount: (count) => `${count} categor${count === 1 ? 'y' : 'ies'}`,
        continueToGoLive: 'Looks Good · Continue to Go Live',
      },
    },
    step5: {
      stepTitle: 'Go live',
      ready: {
        question: 'Ready to go live?',
        helper: 'Your digital menu is ready. Going live makes your menu link active and generates your QR code.',
        buttonText: 'Go Live Now',
        publishing: 'Publishing your menu...',
        notice: 'You will get a 24-hour free trial immediately upon going live. No payment required today.',
      },
      live: {
        question: 'Congratulations! Your menu is live!',
        helper: 'Your restaurant menu is now active online. Customers can scan the QR code to browse.',
        qrTitle: 'Table QR Code',
        qrSubtitle: 'Print this code and place it on your dining tables or billing counter.',
        copyLink: 'Copy Menu Link',
        copied: 'Link Copied to Clipboard!',
        shareWhatsApp: 'Share on WhatsApp',
        downloadQR: 'Download QR Code',
        goToDashboard: 'Go to Owner Dashboard',
        whatsAppShareMessage: (name, url) =>
          `Hello! Check out our digital menu for ${name} here: ${url}`,
      },
    },
  },
  hi: {
    // Hindi translation placeholder structure for future bilingual expansion
    header: {
      stepFormat: (step, question, totalQuestions) =>
        `चरण ${step} / 5 · प्रश्न ${question} / ${totalQuestions}`,
      needHelpWhatsApp: 'मदद चाहिए? WhatsApp',
      signOut: 'लॉग आउट',
      saved: 'सहेजा गया',
      saving: 'सहेज रहे हैं...',
    },
    navigation: {
      continue: 'आगे बढ़ें',
      back: 'पीछे जाएं',
      skip: 'अभी छोड़ें',
      tryAgain: 'पुनः प्रयास करें',
      saveAndContinue: 'सहेजें और आगे बढ़ें',
      goLive: 'मेन्यू लाइव करें',
    },
    step1: {
      stepTitle: 'आपके बारे में',
      name: {
        question: 'आपके रेस्टोरेंट का नाम क्या है?',
        helper: 'यह नाम आपके डिजिटल मेन्यू और टेबल क्यूआर कोड पर दिखेगा।',
        placeholder: 'उदा. ज़ायका हवेली',
        example: 'उदा. रॉयल बिरयानी हाउस',
        errorRequired: 'कृपया रेस्टोरेंट का नाम दर्ज करें।',
      },
      foodType: {
        question: 'आप क्या परोसते हैं?',
        helper: 'वह विकल्प चुनें जो आपके खाने का सबसे अच्छा वर्णन करता है।',
        options: {
          veg: { label: 'शुद्ध शाकाहारी', desc: 'केवल शाकाहारी व्यंजन' },
          nonveg: { label: 'शाकाहारी और मांसाहारी', desc: 'दोनों विकल्प उपलब्ध हैं' },
          cafe: { label: 'कैफे', desc: 'चाय, कॉफी और स्नैक्स' },
          sweets: { label: 'मिठाई', desc: 'पारंपरिक मिठाइयां और नमकीन' },
          bakery: { label: 'बेकरी', desc: 'ताजा केक और पेस्ट्री' },
          other: { label: 'अन्य', desc: 'कोई अन्य प्रकार' },
        },
        otherPlaceholder: 'अपने खाने का प्रकार लिखें',
        errorRequired: 'कृपया एक विकल्प चुनें।',
      },
      phone: {
        question: 'आपका संपर्क फोन नंबर क्या है?',
        helper: '10 अंकों का मोबाइल नंबर दर्ज करें।',
        placeholder: '10 अंकों का मोबाइल नंबर',
        example: 'उदा. 9876543210',
        errorInvalid: 'कृपया मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।',
      },
      city: {
        question: 'आपका रेस्टोरेंट किस शहर में है?',
        helper: 'ग्राहकों को आपका सही आउटलेट पहचानने में मदद करता है।',
        placeholder: 'उदा. मुंबई, दिल्ली, जयपुर',
        example: 'उदा. पुणे, अहमदाबाद',
        errorRequired: 'कृपया अपना शहर दर्ज करें।',
      },
    },
    step2: {
      stepTitle: 'दिखावट',
      logo: {
        question: 'अपने रेस्टोरेंट का लोगो जोड़ें',
        helper: 'वैकल्पिक। लोगो आपके मेन्यू के सबसे ऊपर दिखेगा।',
        uploadLabel: 'लोगो फोटो अपलोड करें',
        uploading: 'अपलोड हो रहा है...',
        success: 'लोगो सफलतापूर्वक अपलोड हुआ',
        errorUpload: 'अपलोड विफल रहा। पुनः प्रयास करें या अभी छोड़ें।',
      },
      style: {
        question: 'मेन्यू के लिए रंग शैली चुनें',
        helper: 'अपनी पसंद का रंग चुनें। इसे कभी भी बदला जा सकता है।',
        presets: {
          warm: { name: 'वार्म एम्बर', desc: 'क्लासिक टेराकोटा और क्रीम' },
          minimal: { name: 'मॉडर्न क्लीन', desc: 'सफेद और चारकोल' },
          dark: { name: 'मिडनाइट लग्जरी', desc: 'गहरा स्लेट और एम्बर' },
          heritage: { name: 'रॉयल हेरिटेज', desc: 'गहरा लाल और सुनहरा' },
        },
      },
      cover: {
        question: 'मेन्यू के लिए कवर फोटो जोड़ें',
        helper: 'वैकल्पिक। अपने रेस्टोरेंट या खास व्यंजन की फोटो लगाएं।',
        uploadLabel: 'कवर फोटो अपलोड करें',
        uploading: 'अपलोड हो रहा है...',
        success: 'कवर फोटो अपलोड हुई',
        errorUpload: 'अपलोड विफल रहा।',
      },
    },
    step3: {
      stepTitle: 'मेन्यू',
      category: {
        question: 'अपनी पहली मेन्यू श्रेणी जोड़ें',
        helper: 'व्यंजनों को व्यवस्थित करने के लिए श्रेणी चुनें या लिखें।',
        placeholder: 'श्रेणी का नाम (उदा. स्टार्टर्स)',
        chips: ['स्टार्टर्स', 'मेन कोर्स', 'रोटी/ब्रेड्स', 'चावल/राइस', 'ड्रिंक्स', 'मीठा/डेसर्ट'],
        errorRequired: 'कृपया कम से कम एक श्रेणी दर्ज करें।',
      },
      dish: {
        question: 'अपना पहला व्यंजन जोड़ें',
        helper: 'नाम और मूल्य दर्ज करें। फोटो और विवरण बाद में जोड़ सकते हैं।',
        nameLabel: 'व्यंजन का नाम',
        namePlaceholder: 'उदा. पनीर बटर मसाला',
        priceLabel: 'मूल्य (₹)',
        pricePlaceholder: 'उदा. 220',
        categoryLabel: 'श्रेणी',
        errorName: 'कृपया व्यंजन का नाम दर्ज करें।',
        errorPrice: 'कृपया सही मूल्य दर्ज करें।',
        dishAddedSuccess: 'व्यंजन जोड़ा गया!',
      },
      more: {
        question: 'आपका मेन्यू शुरू हो गया है!',
        helper: 'आप आगे कैसे बढ़ना चाहते हैं?',
        addAnotherDish: 'एक और व्यंजन जोड़ें',
        photographMenu: 'कागजी मेन्यू की फोटो खींचें (स्कैन)',
        doThisLater: 'यह बाद में करूंगा · आगे बढ़ें',
        requirementWarning: 'कृपया कम से कम 1 श्रेणी और 1 व्यंजन जोड़ें।',
      },
    },
    step4: {
      stepTitle: 'जांचें',
      review: {
        question: 'अपने डिजिटल मेन्यू की जांच करें',
        helper: 'ग्राहक आपके मेन्यू को इस तरह देखेंगे। बदलने के लिए एडिट दबाएं।',
        editSection: 'संपादित करें',
        restaurantDetails: 'रेस्टोरेंट विवरण',
        brandingAndStyle: 'ब्रांडिंग और शैली',
        menuItems: 'व्यंजन सूची',
        dishesCount: (count) => `${count} व्यंजन जोड़े गए`,
        categoriesCount: (count) => `${count} श्रेणियां`,
        continueToGoLive: 'सब ठीक है · लाइव करने के लिए आगे बढ़ें',
      },
    },
    step5: {
      stepTitle: 'लाइव करें',
      ready: {
        question: 'मेन्यू लाइव करने के लिए तैयार हैं?',
        helper: 'लाइव करने पर आपका लिंक सक्रिय हो जाएगा और क्यूआर कोड बन जाएगा।',
        buttonText: 'अभी लाइव करें',
        publishing: 'मेन्यू लाइव किया जा रहा है...',
        notice: 'लाइव करते ही 24 घंटे का निःशुल्क परीक्षण शुरू होगा। आज कोई भुगतान नहीं।',
      },
      live: {
        question: 'बधाई हो! आपका मेन्यू लाइव हो गया है!',
        helper: 'आपका मेन्यू अब ऑनलाइन है। ग्राहक क्यूआर कोड स्कैन करके देख सकते हैं।',
        qrTitle: 'टेबल क्यूआर कोड',
        qrSubtitle: 'इसे प्रिंट करके टेबल या काउंटर पर लगाएं।',
        copyLink: 'मेन्यू लिंक कॉपी करें',
        copied: 'लिंक कॉपी हो गया!',
        shareWhatsApp: 'WhatsApp पर शेयर करें',
        downloadQR: 'क्यूआर कोड डाउनलोड करें',
        goToDashboard: 'डैशबोर्ड पर जाएं',
        whatsAppShareMessage: (name, url) =>
          `नमस्ते! ${name} का डिजिटल मेन्यू देखने के लिए यहां क्लिक करें: ${url}`,
      },
    },
  },
};
