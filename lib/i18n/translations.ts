// This is a utility file for translations
// Define the translation type structure
interface Translation {
  appName: string;
  campusCompanion: string;
  campusCompanionAr: string;
  login: string;
  signup: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  alreadyHaveAccount: string;
  createAccount: string;
  home: string;
  transportation: string;
  food: string;
  study: string;
  social: string;
  profile: string;
  map: string;
  rideshare: string;
  busAlerts: string;
  campusMap: string;
  preOrder: string;
  restaurants: string;
  reviews: string;
  bookPrinting: string;
  bookBorrowing: string;
  examAlerts: string;
  events: string;
  jobs: string;
  editProfile: string;
  notifications: string;
  theme: string;
  darkMode: string;
  lightMode: string;
  language: string;
  appLanguage: string;
  signOut: string;
  unnamed: string;
  uploadAvatar: string;
  tapToChange: string;
  fullName: string;
  username: string;
  enterFullName: string;
  enterUsername: string;
  saveChanges: string;
  cancel: string;
  back: string;
  settings: string;
  enabled: string;
  disabled: string;
  common: {
    welcome: string;
    user: string;
    dismiss: string;
    pleaseWait: string;
    errorMessage: string;
    successMessage: string;
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    update: string;
    remove: string;
    confirm: string;
    yes: string;
    no: string;
    ok: string;
    done: string;
    next: string;
    back: string;
    continue: string;
    retry: string;
    required: string;
    optional: string;
    more: string;
    less: string;
    search: string;
    filter: string;
    sort: string;
    all: string;
    none: string;
    select: string;
    selected: string;
    choose: string;
    change: string;
    reset: string;
    clear: string;
    close: string;
    open: string;
    show: string;
    hide: string;
    expand: string;
    collapse: string;
    enable: string;
    disable: string;
    enabled: string;
    disabled: string;
    on: string;
    off: string;
    start: string;
    stop: string;
    pause: string;
    resume: string;
    restart: string;
    refresh: string;
    reload: string;
    upgrade: string;
    install: string;
    uninstall: string;
    processing: string;
    uploading: string;
    downloading: string;
    loadingMore: string;
    noResults: string;
    noData: string;
    warning: string;
    info: string;
    attention: string;
    notice: string;
    confirmation: string;
    areYouSure: string;
    thisActionCannot: string;
    pleaseConfirm: string;
    tryAgain: string;
    somethingWrong: string;
    contactSupport: string;
    sessionExpired: string;
    pleaseLogin: string;
    notFound: string;
    pageNotFound: string;
    goBack: string;
    goHome: string;
    unauthorized: string;
    forbidden: string;
    accessDenied: string;
    serverError: string;
    networkError: string;
    connectionError: string;
    timeoutError: string;
    offline: string;
    online: string;
    checkConnection: string;
    reloadPage: string;
    unsavedChanges: string;
    saveChangesPrompt: string;
    discardChanges: string;
    saving: string;
    saved: string;
    notSaved: string;
    autoSaved: string;
    lastSaved: string;
    draft: string;
    published: string;
    unpublished: string;
    deleted: string;
    restored: string;
    cannotUndo: string;
    confirmDelete: string;
    confirmDiscard: string;
    keepEditing: string;
    leave: string;
    stay: string;
  };
  transport: {
    rideshare: string;
    searchPlaceholder: string;
    availableRides: string;
    completedRides: string;
    noRidesFound: string;
    back: string;
    errorLoadingRides: string;
    errorCreatingRide: string;
    rideCreatedSuccess: string;
    mustBeLoggedIn: string;
    fillAllFields: string;
    invalidSeats: string;
    pullToRefresh: string;
    refreshing: string;
    chat: {
      participant: string;
      driver: string;
      passenger: string;
      typeMessage: string;
      messageSent: string;
      errorSending: string;
      loadingMessages: string;
      noMessages: string;
    };
  };
  personal: {
    name: string;
    profile: {
      editProfile: string;
      fullName: string;
      username: string;
      email: string;
      gender: {
        title: string;
        male: string;
        female: string;
        other: string;
      };
      tapToChange: string;
      saveChanges: string;
      collegeId: string;
    };
    settings: {
      title: string;
      appLanguage: string;
      push: string;
      theme: string;
      light: string;
      dark: string;
      language: {
        title: string;
        arabic: string;
        english: string;
      };
      notifications: {
        pushEnabled: string;
        pushDisabled: string;
      };
      account: {
        title: string;
        signOut: string;
        deleteAccount: string;
      };
    };
  };
  auth: {
    emailVerification: {
      title: string;
      message: string;
    };
  };
}

// English translations
const en: Translation = {
  // App
  appName: 'UniGO | يوني جو',
  campusCompanion: 'Your Campus Companion',
  campusCompanionAr: 'رفيقك في الحرم الجامعي',
  
  // Auth
  login: 'Log In',
  signup: 'Sign Up',
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm Password',
  forgotPassword: 'Forgot Password?',
  alreadyHaveAccount: 'Already have an account? Log In',
  createAccount: 'Create Account',
  
  // Home
  home: 'Home',
  transportation: 'Transportation',
  food: 'Food',
  study: 'Study & Academic',
  social: 'Social Life',
  profile: 'Personal',
  map: 'Notifications',
  
  // Transportation
  rideshare: 'Rideshare',
  busAlerts: 'Bus Alerts',
  campusMap: 'Campus Map',
  
  // Food
  preOrder: 'Pre-Order',
  restaurants: 'Restaurants',
  reviews: 'Reviews',
  
  // Study
  bookPrinting: 'Book Printing',
  bookBorrowing: 'Book Borrowing',
  examAlerts: 'Exam Alerts',
  
  // Social
  events: 'Events Calendar',
  jobs: 'Job Listings',
  
  // Profile
  editProfile: 'Edit Profile',
  notifications: 'Notifications',
  theme: 'Theme',
  darkMode: 'Dark Mode',
  lightMode: 'Light Mode',
  language: 'Language',
  appLanguage: 'App Language',
  signOut: 'Sign Out',
  unnamed: 'Unnamed',
  uploadAvatar: 'Upload Avatar',
  tapToChange: 'Tap to change profile picture',
  fullName: 'Full Name',
  username: 'Username',
  enterFullName: 'Enter your full name',
  enterUsername: 'Enter username',
  saveChanges: 'Save Changes',
  cancel: 'Cancel',
  back: 'Back',
  settings: 'Settings',
  enabled: 'Enabled',
  disabled: 'Disabled',
  
  // Common
  common: {
    welcome: 'Welcome',
    user: 'User',
    dismiss: 'Dismiss',
    pleaseWait: 'Please wait...',
    errorMessage: 'Error',
    successMessage: 'Success',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    update: 'Update',
    remove: 'Remove',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    done: 'Done',
    next: 'Next',
    back: 'Back',
    continue: 'Continue',
    retry: 'Retry',
    required: 'Required',
    optional: 'Optional',
    more: 'More',
    less: 'Less',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    all: 'All',
    none: 'None',
    select: 'Select',
    selected: 'Selected',
    choose: 'Choose',
    change: 'Change',
    reset: 'Reset',
    clear: 'Clear',
    close: 'Close',
    open: 'Open',
    show: 'Show',
    hide: 'Hide',
    expand: 'Expand',
    collapse: 'Collapse',
    enable: 'Enable',
    disable: 'Disable',
    enabled: 'Enabled',
    disabled: 'Disabled',
    on: 'On',
    off: 'Off',
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Restart',
    refresh: 'Refresh',
    reload: 'Reload',
    upgrade: 'Upgrade',
    install: 'Install',
    uninstall: 'Uninstall',
    processing: 'Processing...',
    uploading: 'Uploading...',
    downloading: 'Downloading...',
    loadingMore: 'Loading more...',
    noResults: 'No results found',
    noData: 'No data available',
    warning: 'Warning',
    info: 'Info',
    attention: 'Attention',
    notice: 'Notice',
    confirmation: 'Confirmation',
    areYouSure: 'Are you sure?',
    thisActionCannot: 'This action cannot be undone',
    pleaseConfirm: 'Please confirm your action',
    tryAgain: 'Please try again',
    somethingWrong: 'Something went wrong',
    contactSupport: 'Please contact support',
    sessionExpired: 'Your session has expired',
    pleaseLogin: 'Please log in again',
    notFound: 'Not found',
    pageNotFound: 'Page not found',
    goBack: 'Go back',
    goHome: 'Go to home',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    accessDenied: 'Access denied',
    serverError: 'Server error',
    networkError: 'Network error',
    connectionError: 'Connection error',
    timeoutError: 'Timeout error',
    offline: 'You are offline',
    online: 'You are online',
    checkConnection: 'Please check your internet connection',
    reloadPage: 'Reload page',
    unsavedChanges: 'You have unsaved changes',
    saveChangesPrompt: 'Save changes?',
    discardChanges: 'Discard changes?',
    saving: 'Saving...',
    saved: 'Saved',
    notSaved: 'Not saved',
    autoSaved: 'Auto-saved',
    lastSaved: 'Last saved',
    draft: 'Draft',
    published: 'Published',
    unpublished: 'Unpublished',
    deleted: 'Deleted',
    restored: 'Restored',
    cannotUndo: 'This cannot be undone',
    confirmDelete: 'Confirm delete',
    confirmDiscard: 'Confirm discard',
    keepEditing: 'Keep editing',
    leave: 'Leave',
    stay: 'Stay'
  },
  transport: {
    rideshare: 'Rideshare',
    searchPlaceholder: 'Search for a ride...',
    availableRides: 'Available Rides',
    completedRides: 'Completed Rides',
    noRidesFound: 'No rides found',
    back: 'Back',
    errorLoadingRides: 'Failed to load rides. Please try again.',
    errorCreatingRide: 'Failed to create ride. Please try again.',
    rideCreatedSuccess: 'Ride created successfully!',
    mustBeLoggedIn: 'You must be logged in to create a ride',
    fillAllFields: 'Please fill in all fields',
    invalidSeats: 'Please enter a valid number of seats',
    pullToRefresh: 'Pull to refresh',
    refreshing: 'Refreshing...',
    chat: {
      participant: 'Chat Participant',
      driver: 'Driver',
      passenger: 'Passenger',
      typeMessage: 'Type a message...',
      messageSent: 'Message sent',
      errorSending: 'Error sending message',
      loadingMessages: 'Loading messages...',
      noMessages: 'No messages yet'
    }
  },
  personal: {
    name: 'Name',
    profile: {
      editProfile: 'Edit Profile',
      fullName: 'Full Name',
      username: 'Username',
      email: 'Email',
      gender: {
        title: 'Gender',
        male: 'Male',
        female: 'Female',
        other: 'Other'
      },
      tapToChange: 'Tap to change',
      saveChanges: 'Save Changes',
      collegeId: 'College ID'
    },
    settings: {
      title: 'Settings',
      appLanguage: 'App Language',
      push: 'Push Notifications',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      language: {
        title: 'Select Language',
        arabic: 'العربية',
        english: 'English'
      },
      notifications: {
        pushEnabled: 'Enabled',
        pushDisabled: 'Disabled'
      },
      account: {
        title: 'Account',
        signOut: 'Sign Out',
        deleteAccount: 'Delete Account'
      }
    }
  },
  auth: {
    emailVerification: {
      title: 'Email Verification',
      message: 'Please check your email to verify your account.'
    }
  }
};

// Arabic translations
const ar: Translation = {
  // App
  appName: 'يوني جو | UniGO',
  campusCompanion: 'رفيقك في الحرم الجامعي',
  campusCompanionAr: 'رفيقك في الحرم الجامعي',
  
  // Auth
  login: 'تسجيل الدخول',
  signup: 'إنشاء حساب',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  confirmPassword: 'تأكيد كلمة المرور',
  forgotPassword: 'نسيت كلمة المرور؟',
  alreadyHaveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
  createAccount: 'إنشاء حساب',
  
  // Home
  home: 'الرئيسية',
  transportation: 'المواصلات',
  food: 'الطعام',
  study: 'الدراسة والأكاديمية',
  social: 'الحياة الاجتماعية',
  profile: 'الملف الشخصي',
  map: 'اشعارات',
  
  // Transportation
  rideshare: 'مشاركة الركوب',
  busAlerts: 'تنبيهات الحافلات',
  campusMap: 'خريطة الحرم الجامعي',
  
  // Food
  preOrder: 'الطلب المسبق',
  restaurants: 'المطاعم',
  reviews: 'التقييمات',
  
  // Study
  bookPrinting: 'طباعة الكتب',
  bookBorrowing: 'استعارة الكتب',
  examAlerts: 'تنبيهات الامتحانات',
  
  // Social
  events: 'تقويم الفعاليات',
  jobs: 'قائمة الوظائف',
  
  // Profile
  editProfile: 'تعديل الملف الشخصي',
  notifications: 'الإشعارات',
  theme: 'المظهر',
  darkMode: 'الوضع الداكن',
  lightMode: 'الوضع الفاتح',
  language: 'اللغة',
  appLanguage: 'لغة التطبيق',
  signOut: 'تسجيل الخروج',
  unnamed: 'بدون اسم',
  uploadAvatar: 'تحميل الصورة الشخصية',
  tapToChange: 'انقر لتغيير الصورة الشخصية',
  fullName: 'الاسم الكامل',
  username: 'اسم المستخدم',
  enterFullName: 'أدخل اسمك الكامل',
  enterUsername: 'أدخل اسم المستخدم',
  saveChanges: 'حفظ التغييرات',
  cancel: 'إلغاء',
  back: 'رجوع',
  settings: 'الإعدادات',
  enabled: 'مفعل',
  disabled: 'معطل',
  
  // Common
  common: {
    welcome: 'مرحباً',
    user: 'المستخدم',
    dismiss: 'تجاهل',
    pleaseWait: 'الرجاء الانتظار...',
    errorMessage: 'خطأ',
    successMessage: 'نجاح',
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    update: 'تحديث',
    remove: 'إزالة',
    confirm: 'تأكيد',
    yes: 'نعم',
    no: 'لا',
    ok: 'موافق',
    done: 'تم',
    next: 'التالي',
    back: 'رجوع',
    continue: 'متابعة',
    retry: 'إعادة المحاولة',
    required: 'مطلوب',
    optional: 'اختياري',
    more: 'المزيد',
    less: 'أقل',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    all: 'الكل',
    none: 'لا شيء',
    select: 'اختيار',
    selected: 'مختار',
    choose: 'اختر',
    change: 'تغيير',
    reset: 'إعادة تعيين',
    clear: 'مسح',
    close: 'إغلاق',
    open: 'فتح',
    show: 'إظهار',
    hide: 'إخفاء',
    expand: 'توسيع',
    collapse: 'طي',
    enable: 'تفعيل',
    disable: 'تعطيل',
    enabled: 'مفعل',
    disabled: 'معطل',
    on: 'تشغيل',
    off: 'إيقاف',
    start: 'بدء',
    stop: 'إيقاف',
    pause: 'إيقاف مؤقت',
    resume: 'استئناف',
    restart: 'إعادة تشغيل',
    refresh: 'تحديث',
    reload: 'إعادة تحميل',
    upgrade: 'ترقية',
    install: 'تثبيت',
    uninstall: 'إلغاء التثبيت',
    processing: 'جاري المعالجة...',
    uploading: 'جاري الرفع...',
    downloading: 'جاري التنزيل...',
    loadingMore: 'جاري تحميل المزيد...',
    noResults: 'لم يتم العثور على نتائج',
    noData: 'لا توجد بيانات متاحة',
    warning: 'تحذير',
    info: 'معلومات',
    attention: 'انتباه',
    notice: 'ملاحظة',
    confirmation: 'تأكيد',
    areYouSure: 'هل أنت متأكد؟',
    thisActionCannot: 'لا يمكن التراجع عن هذا الإجراء',
    pleaseConfirm: 'الرجاء تأكيد إجراءك',
    tryAgain: 'الرجاء المحاولة مرة أخرى',
    somethingWrong: 'حدث خطأ ما',
    contactSupport: 'الرجاء الاتصال بالدعم',
    sessionExpired: 'انتهت صلاحية جلستك',
    pleaseLogin: 'الرجاء تسجيل الدخول مرة أخرى',
    notFound: 'غير موجود',
    pageNotFound: 'الصفحة غير موجودة',
    goBack: 'العودة',
    goHome: 'الذهاب إلى الرئيسية',
    unauthorized: 'غير مصرح',
    forbidden: 'ممنوع',
    accessDenied: 'تم رفض الوصول',
    serverError: 'خطأ في الخادم',
    networkError: 'خطأ في الشبكة',
    connectionError: 'خطأ في الاتصال',
    timeoutError: 'انتهت مهلة الاتصال',
    offline: 'أنت غير متصل',
    online: 'أنت متصل',
    checkConnection: 'يرجى التحقق من اتصال الإنترنت',
    reloadPage: 'إعادة تحميل الصفحة',
    unsavedChanges: 'لديك تغييرات غير محفوظة',
    saveChangesPrompt: 'حفظ التغييرات؟',
    discardChanges: 'تجاهل التغييرات؟',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ',
    notSaved: 'لم يتم الحفظ',
    autoSaved: 'حفظ تلقائي',
    lastSaved: 'آخر حفظ',
    draft: 'مسودة',
    published: 'منشور',
    unpublished: 'غير منشور',
    deleted: 'محذوف',
    restored: 'مستعاد',
    cannotUndo: 'لا يمكن التراجع عن هذا',
    confirmDelete: 'تأكيد الحذف',
    confirmDiscard: 'تأكيد التجاهل',
    keepEditing: 'مواصلة التحرير',
    leave: 'مغادرة',
    stay: 'البقاء'
  },
  transport: {
    rideshare: 'مشاركة الركوب',
    searchPlaceholder: 'البحث عن رحلة...',
    availableRides: 'الرحلات المتاحة',
    completedRides: 'الرحلات المكتملة',
    noRidesFound: 'لم يتم العثور على رحلات',
    back: 'رجوع',
    errorLoadingRides: 'فشل تحميل الرحلات. يرجى المحاولة مرة أخرى.',
    errorCreatingRide: 'فشل إنشاء الرحلة. يرجى المحاولة مرة أخرى.',
    rideCreatedSuccess: 'تم إنشاء الرحلة بنجاح!',
    mustBeLoggedIn: 'يجب تسجيل الدخول لإنشاء رحلة',
    fillAllFields: 'يرجى ملء جميع الحقول',
    invalidSeats: 'يرجى إدخال عدد صحيح من المقاعد',
    pullToRefresh: 'اسحب للتحديث',
    refreshing: 'جاري التحديث...',
    chat: {
      participant: 'المشارك في المحادثة',
      driver: 'السائق',
      passenger: 'الراكب',
      typeMessage: 'اكتب رسالة...',
      messageSent: 'تم إرسال الرسالة',
      errorSending: 'خطأ في إرسال الرسالة',
      loadingMessages: 'جاري تحميل الرسائل...',
      noMessages: 'لا توجد رسائل بعد'
    }
  },
  personal: {
    name: 'الاسم',
    profile: {
      editProfile: 'تعديل الملف الشخصي',
      fullName: 'الاسم الكامل',
      username: 'اسم المستخدم',
      email: 'البريد الإلكتروني',
      gender: {
        title: 'الجنس',
        male: 'ذكر',
        female: 'أنثى',
        other: 'آخر'
      },
      tapToChange: 'اضغط للتغيير',
      saveChanges: 'حفظ التغييرات',
      collegeId: 'الرقم الجامعي'
    },
    settings: {
      title: 'الإعدادات',
      appLanguage: 'لغة التطبيق',
      push: 'الإشعارات',
      theme: 'المظهر',
      light: 'فاتح',
      dark: 'داكن',
      language: {
        title: 'اختر اللغة',
        arabic: 'العربية',
        english: 'English'
      },
      notifications: {
        pushEnabled: 'مفعل',
        pushDisabled: 'معطل'
      },
      account: {
        title: 'الحساب',
        signOut: 'تسجيل الخروج',
        deleteAccount: 'حذف الحساب'
      }
    }
  },
  auth: {
    emailVerification: {
      title: 'تأكيد البريد الإلكتروني',
      message: 'يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك.'
    }
  }
};

// Export the translations object
export const translations = { en, ar }; 