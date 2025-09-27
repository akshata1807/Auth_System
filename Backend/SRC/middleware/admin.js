const jwt = require('jsonwebtoken')

const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey')
    req.user = decoded

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' })
    }

    next()
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' })
  }
}

module.exports = adminAuth