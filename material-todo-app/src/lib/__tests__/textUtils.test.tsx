import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { highlightSearchTerm, formatDuration, capitalize, extractHashtags } from '../textUtils'

describe('textUtils', () => {
  describe('highlightSearchTerm', () => {
    it('should return original text when no search term is provided', () => {
      const result = highlightSearchTerm('Hello world', '')
      expect(result).toBe('Hello world')
    })

    it('should return original text when search term is empty', () => {
      const result = highlightSearchTerm('Hello world', '   ')
      expect(result).toBe('Hello world')
    })

    it('should highlight single word matches', () => {
      const result = highlightSearchTerm('Hello world', 'world')
      const { container } = render(<div>{result}</div>)
      
      const mark = container.querySelector('mark')
      expect(mark).toBeInTheDocument()
      expect(mark).toHaveTextContent('world')
      expect(mark).toHaveClass('bg-yellow-200')
    })

    it('should highlight multiple matches', () => {
      const result = highlightSearchTerm('Hello hello HELLO', 'hello')
      const { container } = render(<div>{result}</div>)
      
      const marks = container.querySelectorAll('mark')
      expect(marks).toHaveLength(3)
      expect(marks[0]).toHaveTextContent('Hello')
      expect(marks[1]).toHaveTextContent('hello')
      expect(marks[2]).toHaveTextContent('HELLO')
    })

    it('should escape special regex characters', () => {
      const result = highlightSearchTerm('Price: $10.99', '$10.99')
      const { container } = render(<div>{result}</div>)
      
      const mark = container.querySelector('mark')
      expect(mark).toBeInTheDocument()
      expect(mark).toHaveTextContent('$10.99')
    })

    it('should handle empty text gracefully', () => {
      const result = highlightSearchTerm('', 'search')
      expect(result).toBe('')
    })
  })

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(30)).toBe('30m')
      expect(formatDuration(45)).toBe('45m')
      expect(formatDuration(59)).toBe('59m')
    })

    it('should format hours without minutes', () => {
      expect(formatDuration(60)).toBe('1h')
      expect(formatDuration(120)).toBe('2h')
      expect(formatDuration(180)).toBe('3h')
    })

    it('should format hours with minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m')
      expect(formatDuration(135)).toBe('2h 15m')
      expect(formatDuration(65)).toBe('1h 5m')
    })

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0m')
    })

    it('should handle large durations', () => {
      expect(formatDuration(1440)).toBe('24h') // 1 day
      expect(formatDuration(1500)).toBe('25h') // 25 hours
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter of lowercase string', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('world')).toBe('World')
    })

    it('should keep first letter capitalized', () => {
      expect(capitalize('Hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('HELLO')
    })

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A')
      expect(capitalize('A')).toBe('A')
    })

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('')
    })

    it('should only capitalize first letter', () => {
      expect(capitalize('hello world')).toBe('Hello world')
      expect(capitalize('hELLO wORLD')).toBe('HELLO wORLD')
    })
  })

  describe('extractHashtags', () => {
    it('should extract hashtags from text', () => {
      const result = extractHashtags('This is a #test with #multiple #hashtags')
      expect(result).toEqual(['test', 'multiple', 'hashtags'])
    })

    it('should handle no hashtags', () => {
      const result = extractHashtags('This has no hashtags')
      expect(result).toEqual([])
    })

    it('should handle hashtags at start and end', () => {
      const result = extractHashtags('#start some text #end')
      expect(result).toEqual(['start', 'end'])
    })

    it('should handle hashtags with unicode characters', () => {
      const result = extractHashtags('Testing #héllo and #مرحبا')
      expect(result).toEqual(['héllo', 'مرحبا'])
    })

    it('should convert hashtags to lowercase', () => {
      const result = extractHashtags('#Test #UPPERCASE #MiXeD')
      expect(result).toEqual(['test', 'uppercase', 'mixed'])
    })

    it('should handle duplicate hashtags', () => {
      const result = extractHashtags('#test #test #different #test')
      expect(result).toEqual(['test', 'test', 'different', 'test'])
    })

    it('should handle empty string', () => {
      const result = extractHashtags('')
      expect(result).toEqual([])
    })
  })
})