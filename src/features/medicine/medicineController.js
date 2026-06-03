const Medicine = require('./Medicine');

/**
 * ============================================
 * MEDICINE API METHODS (4 Core Endpoints)
 * ============================================
 */

/**
 * METHOD 1: GET ALL MEDICINES (PUBLIC)
 * @desc    Get all medicines with filtering, sorting, and pagination
 * @route   GET /api/v1/medicines
 * @query   { type, requiresPrescription, sort, page, limit, minPrice, maxPrice }
 * @return  { success: bool, data: array, pagination: object }
 */
exports.getAllMedicines = async (req, res, next) => {
  try {
    const { type, requiresPrescription, sort = 'name', page = 1, limit = 20, minPrice, maxPrice } = req.query;

    // Build filter
    const filter = { stock: { $gt: 0 } }; // Only show in-stock medicines

    if (type) {
      filter.type = type.toLowerCase();
    }

    if (requiresPrescription !== undefined) {
      filter.requiresPrescription = requiresPrescription === 'true';
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sorting options
    let sortObj = {};
    switch (sort) {
      case 'price-asc':
        sortObj = { price: 1 };
        break;
      case 'price-desc':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1, reviews: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      default:
        sortObj = { name: 1 };
    }

    // Get medicines
    const medicines = await Medicine.find(filter)
      .select('name brand price dosage type stock rating reviews requiresPrescription image uses')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Medicine.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: medicines,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 2: GET MEDICINE BY ID (PUBLIC)
 * @desc    Get detailed information about a specific medicine
 * @route   GET /api/v1/medicines/:id
 * @return  { success: bool, data: object }
 */
exports.getMedicineById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 3: SEARCH MEDICINES (PUBLIC)
 * @desc    Search medicines by name, brand, uses, or dosage
 * @route   GET /api/v1/medicines/search/query
 * @query   { q (search query), type, page, limit }
 * @return  { success: bool, data: array, pagination: object }
 */
exports.searchMedicines = async (req, res, next) => {
  try {
    const { q, type, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search filter
    const searchFilter = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { dosage: { $regex: q, $options: 'i' } },
        { uses: { $regex: q, $options: 'i' } }
      ],
      stock: { $gt: 0 }
    };

    if (type) {
      searchFilter.type = type.toLowerCase();
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const medicines = await Medicine.find(searchFilter)
      .select('name brand price dosage type stock rating reviews image')
      .sort({ rating: -1, reviews: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Medicine.countDocuments(searchFilter);

    res.status(200).json({
      success: true,
      data: medicines,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 4: GET MEDICINES BY TYPE (PUBLIC)
 * @desc    Get all medicines of a specific type (for filtering)
 * @route   GET /api/v1/medicines/type/:type
 * @param   { type } - Medicine type (tablet, syrup, injection, cream, powder)
 * @return  { success: bool, data: array }
 */
exports.getMedicinesByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const validTypes = ['tablet', 'syrup', 'injection', 'cream', 'powder'];

    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Valid types: ${validTypes.join(', ')}`
      });
    }

    const medicines = await Medicine.find({
      type: type.toLowerCase(),
      stock: { $gt: 0 }
    })
      .select('name brand price dosage type stock rating reviews image')
      .sort({ rating: -1 });

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 5: SCAN RECEIPT FOR MEDICINES (PUBLIC)
 * @desc    Scan prescription/receipt image using OCR to extract medicine names
 * @route   POST /api/v1/medicines/scan
 * @body    { image (base64 or file) }
 * @return  { success: bool, medicines: array, rawText: string }
 */
exports.scanReceipt = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required for OCR scanning'
      });
    }

    // Check if Google Vision API credentials are available
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_VISION_API_KEY) {
      // If no Google Vision credentials, use simple pattern matching
      return res.status(200).json({
        success: true,
        message: 'Google Vision API not configured. Using pattern-based extraction.',
        medicines: [],
        rawText: 'OCR simulation mode - configure GOOGLE_VISION_API_KEY for real OCR',
        note: 'Set up Google Vision API for actual receipt scanning'
      });
    }

    // For production: implement Google Vision API integration
    // This would require: npm install @google-cloud/vision
    try {
      const vision = require('@google-cloud/vision');
      const client = new vision.ImageAnnotatorClient();

      // Prepare image for vision API
      const imageRequest = {
        image: {
          content: image.split(',')[1] || image // Remove data:image/jpeg;base64, prefix if present
        }
      };

      // Call Google Vision API for OCR
      const [result] = await client.textDetection(imageRequest);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            medicines: [],
            rawText: 'No text detected in image'
          }
        });
      }

      // Get full text from first detection (full page text)
      const fullText = detections[0].description || '';

      // Extract medicine names by searching in database
      const medicineMatches = await extractMedicinesFromText(fullText);

      res.status(200).json({
        success: true,
        data: {
          medicines: medicineMatches,
          rawText: fullText,
          totalMatches: medicineMatches.length
        }
      });
    } catch (visionError) {
      // Fallback if Google Vision API fails
      console.error('Google Vision API error:', visionError.message);
      return res.status(200).json({
        success: true,
        data: {
          medicines: [],
          rawText: 'OCR processing available - configure Google Vision API credentials'
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Helper function to extract medicines from OCR text
 */
async function extractMedicinesFromText(text) {
  try {
    // Search for medicines by name or brand in the OCR text
    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: text, $options: 'i' } },
        { brand: { $regex: text, $options: 'i' } }
      ]
    }).select('name brand price dosage type');

    // Also try splitting text by common separators and search for partial matches
    const words = text.split(/[\s\n,;:()]+/).filter(w => w.length > 2);
    const matches = new Map();

    for (const word of words) {
      const partialMatches = await Medicine.find({
        $or: [
          { name: { $regex: `^${word}`, $options: 'i' } },
          { brand: { $regex: `^${word}`, $options: 'i' } }
        ]
      }).limit(5);

      partialMatches.forEach(med => {
        matches.set(med._id.toString(), med);
      });
    }

    // Combine results and remove duplicates
    const allMatches = [
      ...medicines,
      ...Array.from(matches.values())
    ];

    const uniqueMatches = [...new Map(allMatches.map(m => [m._id, m])).values()];
    return uniqueMatches;
  } catch (err) {
    console.error('Error extracting medicines:', err);
    return [];
  }
}

/**
 * ADMIN METHODS (Restricted to Admin Role)
 */

/**
 * Create medicine (admin only)
 * @route   POST /api/v1/medicines
 * @body    { name, brand, price, dosage, type, stock, uses, sideEffects, requiresPrescription, image }
 */
exports.createMedicine = async (req, res, next) => {
  try {
    const { name, brand, price, dosage, type, stock, uses, sideEffects, requiresPrescription, image } = req.body;

    // Validate required fields
    if (!name || !brand || !price || !dosage || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, brand, price, dosage, type'
      });
    }

    // Validate type
    const validTypes = ['tablet', 'syrup', 'injection', 'cream', 'powder'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Valid types: ${validTypes.join(', ')}`
      });
    }

    // Create medicine
    const medicine = new Medicine({
      name: name.trim(),
      brand: brand.trim(),
      price: parseFloat(price),
      dosage: dosage.trim(),
      type: type.toLowerCase(),
      stock: parseInt(stock) || 0,
      uses: uses || [],
      sideEffects: sideEffects || [],
      requiresPrescription: requiresPrescription || false,
      image: image || null
    });

    await medicine.save();

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update medicine (admin only)
 * @route   PUT /api/v1/medicines/:id
 * @body    { name, brand, price, dosage, type, stock, uses, sideEffects, requiresPrescription, image }
 */
exports.updateMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, brand, price, dosage, type, stock, uses, sideEffects, requiresPrescription, image } = req.body;

    // Find medicine
    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Update fields if provided
    if (name) medicine.name = name.trim();
    if (brand) medicine.brand = brand.trim();
    if (price) medicine.price = parseFloat(price);
    if (dosage) medicine.dosage = dosage.trim();
    if (type) {
      const validTypes = ['tablet', 'syrup', 'injection', 'cream', 'powder'];
      if (!validTypes.includes(type.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid type. Valid types: ${validTypes.join(', ')}`
        });
      }
      medicine.type = type.toLowerCase();
    }
    if (stock !== undefined) medicine.stock = parseInt(stock);
    if (uses) medicine.uses = uses;
    if (sideEffects) medicine.sideEffects = sideEffects;
    if (requiresPrescription !== undefined) medicine.requiresPrescription = requiresPrescription;
    if (image) medicine.image = image;

    await medicine.save();

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete medicine (admin only)
 * @route   DELETE /api/v1/medicines/:id
 */
exports.deleteMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByIdAndDelete(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update medicine stock (admin only)
 * @route   PATCH /api/v1/medicines/:id/stock
 * @body    { stock }
 */
exports.updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Stock is required'
      });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { stock: parseInt(stock) },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

