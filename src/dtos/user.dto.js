// User DTOs

// Response DTO - loại bỏ sensitive data
function userResponseDTO(user) {
  if (!user) return null;

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    phone: user.phone,
    role: user.role,
    default_address: user.default_address,
    createdAt: user.createdAt,
  };
}

// Register DTO - validate input
function createUserDTO(data) {
  const errors = [];

  if (!data.email) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  if (!data.password) {
    errors.push("Password is required");
  } else if (data.password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      email: data.email?.toLowerCase().trim(),
      password: data.password,
      name: data.name?.trim() || null,
    },
  };
}

// Update Profile DTO
function updateUserDTO(data) {
  const cleanData = {};

  if (data.name !== undefined) cleanData.name = data.name?.trim() || null;
  if (data.phone !== undefined) cleanData.phone = data.phone?.trim() || null;
  // avatar giờ được xử lý qua multer upload, không lấy từ body nữa
  if (data.default_address !== undefined) {
    // Khi gửi qua FormData, default_address có thể là JSON string
    if (typeof data.default_address === 'string') {
      try {
        cleanData.default_address = JSON.parse(data.default_address);
      } catch {
        cleanData.default_address = data.default_address;
      }
    } else {
      cleanData.default_address = data.default_address;
    }
  }

  return cleanData;
}

// Login DTO
function loginDTO(data) {
  const errors = [];

  if (!data.email) {
    errors.push("Email is required");
  }

  if (!data.password) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      email: data.email?.toLowerCase().trim(),
      password: data.password,
    },
  };
}

module.exports = {
  userResponseDTO,
  createUserDTO,
  updateUserDTO,
  loginDTO,
};
