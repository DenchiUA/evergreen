import React from 'react'
import PropTypes from 'prop-types'
import Box from 'ui-box'

import getDaysInMonth from 'date-fns/get_days_in_month'
import startOfMonth from 'date-fns/start_of_month'
import addDays from 'date-fns/add_days'
import getDay from 'date-fns/get_day'
import isSameDay from 'date-fns/is_same_day'

import { majorScale } from '../../scales'
import { Text } from '../../typography'
import { ThemeConsumer } from '../../theme'
import { Button } from '../../buttons'
import { Icon } from '../../icon'

export const SUN = 0
export const MON = 1
export const TUE = 2
export const WED = 3
export const THU = 4
export const FRI = 5
export const SAT = 6

function makeDaysArray(pivot, length, { increment = 1, ...rest } = {}) {
  return Array.from({ length }).reduce(
    ({ acc, pivot }) => {
      const date = addDays(pivot, increment)
      const props = Object.entries(rest).reduce((acc, [key, value]) => {
        return {
          ...acc,
          [key]: typeof value === 'function' ? value(date) : value
        }
      }, {})
      return {
        acc:
          increment > 0
            ? [...acc, { date, ...props }]
            : [{ date, ...props }, ...acc],
        pivot: date
      }
    },
    { acc: [], pivot }
  ).acc
}

function makeCalendarData(pivotDate) {
  const today = new Date()
  const totalDays = getDaysInMonth(pivotDate)
  const firstDay = startOfMonth(pivotDate)
  const lastDay = addDays(firstDay, totalDays)
  const dayOfFirstDay = getDay(firstDay)
  const dayOfLastDay = getDay(lastDay)

  const present = makeDaysArray(addDays(firstDay, -1), totalDays, {
    isCurrentMonth: true,
    isToday: date => isSameDay(date, today),
    isSelected: date => isSameDay(date, pivotDate)
  })

  // Complement days from previous month
  const past = makeDaysArray(
    firstDay,
    dayOfFirstDay === SUN ? 0 : dayOfFirstDay,
    {
      increment: -1,
      isCurrentMonth: false
    }
  )
  const future = makeDaysArray(
    addDays(lastDay, -1),
    dayOfLastDay === SUN ? 0 : SAT - dayOfLastDay + 1,
    {
      increment: 1,
      isCurrentMonth: false
    }
  )

  return [...past, ...present, ...future]
}

function DateBox({ children, ...props }) {
  return (
    <Box
      userSelect="none"
      width={`${100 / 7}%`}
      height={majorScale(4)}
      textAlign="center"
      {...props}
    >
      {children}
    </Box>
  )
}

function getWeekdayNames(dates, locale, { weekday }) {
  return dates.map(d => {
    const name = new Intl.DateTimeFormat(locale, { weekday }).format(d)
    // Some locales may have the same weekday name in narrow format
    // e.g. T(iistai) and T(orstai) in Finnish
    return { name, key: name + d }
  })
}

const DEFAULT = {
  locale: 'en-US',
  localeOptions: {
    weekday: 'short',
    month: 'long',
    year: 'numeric',
    day: 'numeric'
  }
}

function Calendar({
  pivotDate,
  onClick,
  locale = DEFAULT.locale,
  localeOptions = DEFAULT.localeOptions,
  ...rest
}) {
  const dates = makeCalendarData(pivotDate)
  const weekdays = getWeekdayNames(
    dates.slice(0, 7).map(({ date }) => date),
    locale,
    localeOptions
  )
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: localeOptions.day || DEFAULT.localeOptions.day
  })

  return (
    <Box
      display="flex"
      alignItems="center"
      flexWrap="wrap"
      paddingTop={majorScale(2)}
      {...rest}
    >
      {weekdays.map(({ name, key }) => (
        <DateBox key={key}>
          <Text fontWeight={600}>{name}</Text>
        </DateBox>
      ))}

      {dates.map(({ date, isCurrentMonth, isToday, isSelected }) => (
        <ThemeConsumer key={date.toString()}>
          {theme => (
            <DateBox>
              <Button
                padding={0}
                display="block"
                width="100%"
                textAlign="center"
                appearance={isSelected ? 'primary' : 'minimal'}
                position="relative"
                onClick={() => onClick && onClick(date)}
                color={
                  isSelected
                    ? theme.scales.neutral.N1
                    : isCurrentMonth
                      ? theme.colors.text.dark
                      : theme.scales.neutral.N5
                }
              >
                {dateFormatter.format(date)}
                {isToday ? (
                  <Icon
                    icon="dot"
                    color={isSelected ? theme.scales.neutral.N1 : 'info'}
                    position="absolute"
                    bottom={0}
                    right={0}
                  />
                ) : null}
              </Button>
            </DateBox>
          )}
        </ThemeConsumer>
      ))}
    </Box>
  )
}

Calendar.propTypes = {
  pivotDate: PropTypes.instanceOf(Date).isRequired,
  onClick: PropTypes.func,
  locale: PropTypes.string,
  localeOptions: PropTypes.object
}

export default Calendar
